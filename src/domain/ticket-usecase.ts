import { DataSource, LessThanOrEqual, MoreThanOrEqual } from "typeorm";
import { Ticket } from "../database/entities/ticket";

export interface ListTicket {
    limit: number;
    page: number;
  }

  export interface UpdateScheduleParams {
    id:number;
    date: Date;
    movieId: number;
    auditoriumId:number
  }

export class TicketUsecase {
    constructor(private readonly db: DataSource) {}

    async listTicket(
        listTicket: ListTicket
      ): Promise<{ tickets: Ticket[]; totalCount: number }> {
        const query = this.db.createQueryBuilder(Ticket, "tickets");
        
        query.skip((listTicket.page - 1) * listTicket.limit);
        query.take(listTicket.limit);
    
        const [tickets, totalCount] = await query.getManyAndCount();
        return {
            tickets,
          totalCount,
        };
      }
/*
      async getScheduleById(scheduleId: number): Promise<Schedule> {
        const query = this.db.createQueryBuilder(Schedule, "schedules");
      
        query.where("schedules.id = :id", { id: scheduleId });
      
        const schedule = await query.getOne();
      
        if (!schedule) {
          throw new Error('Schedule not found');
        }
      
        return schedule;
      }

      async getScheduleBetween(startDate: string, endDate: string): Promise<Schedule[]> {
        const query = this.db.createQueryBuilder(Schedule, "schedules");
    
        query.where("schedules.date >= :startDate AND schedules.date <= :endDate", { startDate, endDate });
    
        const schedules = await query.getMany();
    
        if (!schedules || schedules.length === 0) {
            throw new Error('No schedules found between the specified dates');
        }
    
        return schedules;
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
    scheduleFound.duration+=30;
  
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

    // calculate end time, duration here is in minutes
    const endTime = new Date(schedule.date.getTime() + schedule.duration * 60000);
  
    // check for overlap
    const overlappingSchedules = await repo.find({
      where: [
        {
          movieId: schedule.movieId,
          auditoriumId: schedule.auditoriumId,
          date: LessThanOrEqual(endTime),
        },
        {
          movieId: schedule.movieId,
          auditoriumId: schedule.auditoriumId,
          date: MoreThanOrEqual(schedule.date),
        }
      ]
    });
  
    return overlappingSchedules.length > 0;
  }

async deleteSchedule(id: number): Promise<Schedule | null> {
    const repo = this.db.getRepository(Schedule);
    const scheduleFound = await repo.findOneBy({ id });
  
    if (!scheduleFound) return null;
  
    await repo.remove(scheduleFound);
    return scheduleFound;
  }*/
}
