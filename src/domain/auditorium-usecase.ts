import { DataSource } from "typeorm";
import { Auditorium } from "../database/entities/auditorium";

export interface ListAuditorium {
  limit: number;
  page: number;
}

export interface UpdateAuditoriumParams {
  seats?: number;
}

export class AuditoriumUsecase {
  constructor(private readonly db: DataSource) {}

  async listAuditorium(
    listAuditoriums: ListAuditorium
  ): Promise<{ auditoriums: Auditorium[]; totalCount: number }> {
    console.log(listAuditoriums);
    const query = this.db.createQueryBuilder(Auditorium, "auditoriums");

    query.skip((listAuditoriums.page - 1) * listAuditoriums.limit);
    query.take(listAuditoriums.limit);

    const [auditoriums, totalCount] = await query.getManyAndCount();
    return {
        auditoriums,
      totalCount,
    };
  }
  async deleteAuditoriumCollection(id: number): Promise<Auditorium | null> {
    const repo = this.db.getRepository(Auditorium);
    const auditoriumFound = await repo.findOneBy({ id });

    if (!auditoriumFound) return null;

    await repo.remove(auditoriumFound);
    return auditoriumFound;
  }

  async updateAuditorium(
    id: number,
    { seats }: UpdateAuditoriumParams
  ): Promise<Auditorium | null> {
    const repo = this.db.getRepository(Auditorium);
    const auditoriumfound = await repo.findOneBy({ id });
    if (auditoriumfound === null) return null;

    if (seats) {
        auditoriumfound.seats = seats;
    }

    const auditoriumUpdate = await repo.save(auditoriumfound);
    return auditoriumUpdate;
  }
}
