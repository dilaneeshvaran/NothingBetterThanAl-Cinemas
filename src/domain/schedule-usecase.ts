import { Between, DataSource, LessThanOrEqual, MoreThanOrEqual } from "typeorm";
import { Schedule } from "../database/entities/schedule";
import { Movie } from "../database/entities/movie";


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
    let scheduleDuration=0;
    const movieRepo =  this.db.getRepository(Movie);
    const movie = await movieRepo.findOne({ where: { id: schedule.movieId } });

if (movie) {
  const movieDuration = movie.duration;
  scheduleDuration = movieDuration+30;
}

    // calculate end time, duration here is in minutes
    const endTime = new Date(schedule.date.getTime() + scheduleDuration * 60000);
  
    // check for overlap
    const overlappingSchedules = await repo.find({
      where: [
        {
          movieId: schedule.movieId,
          date: Between(schedule.date, endTime)
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
  }

  async getSchedulesByMovieId(movieId: number): Promise<Schedule[]> {
    const repo = this.db.getRepository(Schedule);
    const schedules = await repo.find({ where: { movieId } });
    return schedules;
}

}
