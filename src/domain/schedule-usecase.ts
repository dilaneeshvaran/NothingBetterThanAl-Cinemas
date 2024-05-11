import { DataSource } from "typeorm";
import { Schedule } from "../database/entities/schedule";
import { Movie } from "../database/entities/movie";
import { Ticket } from "../database/entities/ticket";
import { Auditorium } from "../database/entities/auditorium";
import { SuperTicket } from "../database/entities/super-ticket";


export interface ListSchedule {
    limit: number;
    page: number;
  }

  export interface UpdateScheduleParams {
    id:number;
    date: Date;
    movieId: number;
    auditoriumId:number
  }

export class ScheduleUsecase {
    constructor(private readonly db: DataSource) {}

    async listSchedule(
        listSchedule: ListSchedule
      ): Promise<{ schedules: Schedule[]; totalCount: number }> {
        const query = this.db.createQueryBuilder(Schedule, "schedules");
        
        query.skip((listSchedule.page - 1) * listSchedule.limit);
        query.take(listSchedule.limit);
    
        const [schedules, totalCount] = await query.getManyAndCount();
        return {
            schedules,
          totalCount,
        };
      }

      async getScheduleById(scheduleId: number): Promise<Schedule & { auditoriumCapacity: number, ticketsSold: number }> {
        const scheduleQuery = this.db.createQueryBuilder(Schedule, "schedules");
        scheduleQuery.where("schedules.id = :id", { id: scheduleId });
      
        const schedule = await scheduleQuery.getOne();
      
        if (!schedule) {
          throw new Error('Schedule not found');
        }
      
        const auditoriumQuery = this.db.createQueryBuilder(Auditorium, "auditoriums");
        auditoriumQuery.where("auditoriums.id = :id", { id: schedule.auditoriumId });
      
        const auditorium = await auditoriumQuery.getOne();
      
        if (!auditorium) {
          throw new Error('Auditorium not found');
        }
      
        const ticketsSold = await this.getTicketsSold(scheduleId);
      
        return {
          ...schedule,
          auditoriumCapacity: auditorium.capacity,
          ticketsSold: ticketsSold
        };
      }

      async getTicketsSold(scheduleId: number): Promise<number> {
        const ticketQuery = this.db.createQueryBuilder(Ticket, "tickets");
        ticketQuery.where("tickets.scheduleId = :id", { id: scheduleId });
      
        const superTicketQuery = this.db.createQueryBuilder(SuperTicket, "supertickets");
        superTicketQuery.where("FIND_IN_SET(:id, `supertickets`.`usedSchedules`)", { id: scheduleId });
      
        const ticketsSold = await ticketQuery.getCount() + await superTicketQuery.getCount();
      
        return ticketsSold;
      }

    async getScheduleBetween(startDate: string, endDate: string): 
      Promise<{ schedule: Schedule; ticketsSold: number }[]> {
        const query = this.db.createQueryBuilder(Schedule, "schedules");
        const ticketRepo = this.db.getRepository(Ticket);
      
        query.where("schedules.date >= :startDate AND schedules.date <= :endDate", { startDate, endDate });
      
        const schedules = await query.getMany();
      
        if (!schedules || schedules.length === 0) {
          throw new Error('No schedules found between the specified dates');
        }
      
        return Promise.all(schedules.map(async (schedule) => {
          const tickets = await ticketRepo.find({ where: { scheduleId: schedule.id } });
          return {
            schedule,
            ticketsSold: tickets.length
          };
        }));
      }

async updateSchedule(
  id: number,
  { date,movieId, auditoriumId }: UpdateScheduleParams
): Promise<Schedule | null> {
  const repo = this.db.getRepository(Schedule);
  const scheduleFound = await repo.findOneBy({ id });
  if (scheduleFound === null) return null;

  if (date) {
    scheduleFound.date = date;
  }  
  if (movieId) {
    scheduleFound.movieId = movieId;
  }
  if (auditoriumId) {
    scheduleFound.auditoriumId = auditoriumId;
  }
  if (await this.doesOverlap(scheduleFound)) {
    throw new Error("Overlapping schedules are not allowed");
  }
  const scheduleUpdate = await repo.save(scheduleFound);
  return scheduleUpdate;
}

async doesOverlap(schedule: Schedule): Promise<boolean> {
  const repo = this.db.getRepository(Schedule);
  let scheduleDuration = 0;
  const movieRepo = this.db.getRepository(Movie);
  const movie = await movieRepo.findOne({ where: { id: schedule.movieId } });

  if (movie) {
    const movieDuration = movie.duration;
    scheduleDuration = movieDuration + 30; // movie duration + cleaning & publicity interval
  }

  // calculate end time, duration here is in minutes
  const endTime = new Date(schedule.date.getTime() + scheduleDuration * 60000);

  // check for overlap
const overlappingSchedules = await repo.createQueryBuilder("schedule")
.innerJoin(Movie, "movie", "movie.id = schedule.movieId")
.where("schedule.movieId = :movieId", { movieId: schedule.movieId })
.andWhere("schedule.id != :id", { id: schedule.id }) // ignore when updating
.andWhere("schedule.date <= :endTime AND DATE_ADD(schedule.date, INTERVAL movie.duration + 30 MINUTE) >= :startTime", 
          { endTime: endTime, startTime: schedule.date })
.getMany();

  return overlappingSchedules.length > 0;
}

isCorrectDate(schedule: Schedule): boolean {
  const now = new Date();
  // remove time part from the date
  now.setHours(0, 0, 0, 0);
  const scheduleDate = new Date(schedule.date);
  scheduleDate.setHours(0, 0, 0, 0);
  return scheduleDate >= now;
}

async deleteSchedule(id: number): Promise<Schedule | null> {
    const repo = this.db.getRepository(Schedule);
    const scheduleFound = await repo.findOneBy({ id });
  
    if (!scheduleFound) return null;
  
    await repo.remove(scheduleFound);
    return scheduleFound;
  }

  async getSchedulesByMovieId(movieId: number): Promise<number[]> {
    const repo = this.db.getRepository(Schedule);
    const schedules = await repo.find({ 
        select: ["id"], 
        where: { movieId } 
    });
    return schedules.map(schedule => schedule.id);
}

}
