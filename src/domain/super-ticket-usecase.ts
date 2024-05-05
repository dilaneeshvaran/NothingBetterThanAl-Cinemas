import { DataSource, LessThanOrEqual, MoreThanOrEqual } from "typeorm";
import { SuperTicket } from "../database/entities/super-ticket";

export interface ListSuperTicketParams {
    limit: number;
    page: number;
}

export interface UpdateSuperTicketParams {
    id: number;
    price?: number;
}

export class SuperTicketUsecase {
    constructor(private readonly db: DataSource) {}

    async listSuperTickets(
        listSuperTicketParams: ListSuperTicketParams
    ): Promise<{ superTickets: SuperTicket[]; totalCount: number }> {
        const query = this.db.createQueryBuilder(SuperTicket, "supertickets");
        
        query.skip((listSuperTicketParams.page - 1) * listSuperTicketParams.limit);
        query.take(listSuperTicketParams.limit);
    
        const [superTickets, totalCount] = await query.getManyAndCount();
        return {
            superTickets,
            totalCount,
        };
    }

    async getSuperTicketById(superTicketId: number): Promise<SuperTicket> {
        const query = this.db.createQueryBuilder(SuperTicket, "supertickets");
      
        query.where("supertickets.id = :id", { id: superTicketId });
      
        const superTicket = await query.getOne();
      
        if (!superTicket) {
          throw new Error('SuperTicket not found');
        }
      
        return superTicket;
    }   

    async updateSuperTicket(
        id: number,
        { price }: UpdateSuperTicketParams
    ): Promise<SuperTicket | null> {
        const repo = this.db.getRepository(SuperTicket);
        const superTicketFound = await repo.findOne({ where: { id } });
        if (!superTicketFound) return null;
      
        if (price) {
          superTicketFound.price = price;
        }        
        const superTicketUpdate = await repo.save(superTicketFound);
        return superTicketUpdate;
    }
    
    async deleteSuperTicket(id: number): Promise<SuperTicket | null> {
        const repo = this.db.getRepository(SuperTicket);
        const superTicketFound = await repo.findOne({ where: { id } });
    
        if (!superTicketFound) return null;
    
        await repo.remove(superTicketFound);
        return superTicketFound;
    }
}