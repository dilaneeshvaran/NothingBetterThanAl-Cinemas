import { DataSource } from "typeorm";
import { Auditorium } from "../database/entities/auditorium";
import { Schedule } from "../database/entities/schedule";
import { Between } from "typeorm";
import { Image } from "../database/entities/image";


export interface ListAuditorium {
  limit: number;
  page: number;
}

export interface UpdateAuditoriumParams {
  name?: string;
  description?: string;
  imageUrl?:string;
  type?: string;
  capacity?: number;
  handicapAccessible?: boolean;
  maintenance?:boolean;
}

export class AuditoriumUsecase {
  constructor(private readonly db: DataSource) {}

  async listAuditorium(
    listAuditoriums: ListAuditorium
  ): Promise<{ auditoriums: Auditorium[]; totalCount: number }> {
    const query = this.db.createQueryBuilder(Auditorium, "auditoriums");

    query.where("auditoriums.maintenance = :maintenance", { maintenance: false });

    query.skip((listAuditoriums.page - 1) * listAuditoriums.limit);
    query.take(listAuditoriums.limit);

    const [auditoriums, totalCount] = await query.getManyAndCount();
    return {
        auditoriums,
      totalCount,
    };
  }


async updateAuditorium(
  id: number,
  { name, description, type,imageUrl, capacity, handicapAccessible, maintenance }: UpdateAuditoriumParams
): Promise<Auditorium | null> {
  const repo = this.db.getRepository(Auditorium);
  const auditoriumfound = await repo.findOneBy({ id });
  if (auditoriumfound === null) return null;

  if (name) {
    auditoriumfound.name = name;
  }
  if (description) {
    auditoriumfound.description = description;
  }
  if (type) {
    auditoriumfound.type = type;
  }
  if (imageUrl) {
    auditoriumfound.imageUrl = imageUrl;
  }
  if (capacity) {
    if (capacity < 15 || capacity > 30) {
      throw new Error("Capacity must be between 15 and 30");
    }
    auditoriumfound.capacity = capacity;
  }
  if (handicapAccessible !== undefined) {
    auditoriumfound.handicapAccessible = handicapAccessible;
  }
  if (maintenance !== undefined) {
    auditoriumfound.maintenance = maintenance;
  }

  const auditoriumUpdate = await repo.save(auditoriumfound);
  return auditoriumUpdate;
}

async deleteAuditoriumCollection(id: number): Promise<Auditorium | null> {
  const repo = this.db.getRepository(Auditorium);
  const auditoriumFound = await repo.findOneBy({ id });

  if (!auditoriumFound) return null;

  const auditoriumCount = await repo.count();
    if (auditoriumCount <= 10) {
      throw new Error("At least 10 auditoriums must be present");
    }

  await repo.remove(auditoriumFound);
  return auditoriumFound;
}

async getAuditoriumSchedule(auditoriumId: number, startDate: Date): 
Promise<{ schedule: Schedule; ticketsSold: number }[]> {
  const scheduleRepo = this.db.getRepository(Schedule);

  //pour avoir le planning des 7 jours qui suivent le startDate
  const endDate = new Date();
  endDate.setDate(startDate.getDate() + 7);

  const schedules = await scheduleRepo.find({
    where: {
      auditorium: { id: auditoriumId },
      date: Between(startDate, endDate)
    },
    relations: ["movie", "tickets"]
  });

  return schedules.map(schedule => ({
    schedule,
    ticketsSold: schedule.tickets.length
  }));
}
}

