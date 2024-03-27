import { DataSource, LessThanOrEqual, MoreThanOrEqual } from "typeorm";
import { Schedule } from "../database/entities/schedule";
import { Movie } from "../database/entities/movie"
import { Auditorium } from "../database/entities/auditorium"

export interface ListSchedule {
    limit: number;
    page: number;
  }

  export interface UpdateScheduleParams {
    id:number;
    date: Date;
    movie: Movie;
    auditorium:Auditorium
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

async updateSchedule(
  id: number,
  { date,movie, auditorium }: UpdateScheduleParams
): Promise<Schedule | null> {
  const repo = this.db.getRepository(Schedule);
  const scheduleFound = await repo.findOneBy({ id });
  if (scheduleFound === null) return null;

  if (date) {
    scheduleFound.date = date;
  }
    scheduleFound.duration = movie.duration+30;
  
  if (movie) {
    scheduleFound.movie = movie;
  }
  if (auditorium) {
    scheduleFound.auditorium = auditorium;
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
          movie: schedule.movie,
          auditorium: schedule.auditorium,
          date: LessThanOrEqual(endTime),
        },
        {
          movie: schedule.movie,
          auditorium: schedule.auditorium,
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
  }
}
