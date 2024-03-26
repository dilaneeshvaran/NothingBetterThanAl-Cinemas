import { DataSource } from "typeorm";
import { Between } from "typeorm";
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
    duration: number;
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

async updateSchedule(
  id: number,
  { date, duration,movie, auditorium }: UpdateScheduleParams
): Promise<Schedule | null> {
  const repo = this.db.getRepository(Schedule);
  const scheduleFound = await repo.findOneBy({ id });
  if (scheduleFound === null) return null;

  if (date) {
    scheduleFound.date = date;
  }
  if (duration) {
    scheduleFound.duration = duration;
  }
  if (movie) {
    scheduleFound.movie = movie;
  }
  if (auditorium) {
    scheduleFound.auditorium = auditorium;
  }

  const scheduleUpdate = await repo.save(scheduleFound);
  return scheduleUpdate;
}
async deleteSchedule(id: number): Promise<Schedule | null> {
    const repo = this.db.getRepository(Schedule);
    const scheduleFound = await repo.findOneBy({ id });
  
    if (!scheduleFound) return null;
  
    await repo.remove(scheduleFound);
    return scheduleFound;
  }
}
