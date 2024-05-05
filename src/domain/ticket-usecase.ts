import { DataSource, LessThanOrEqual, MoreThanOrEqual } from "typeorm";
import { Ticket } from "../database/entities/ticket";

export interface ListTicket {
    limit: number;
    page: number;
  }

  export interface UpdateTicketParams {
    id:number;
    price?: number;
    movieId?: number;
    scheduleId?:number
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

      async getTicketById(ticketId: number): Promise<Ticket> {
        const query = this.db.createQueryBuilder(Ticket, "tickets");
      
        query.where("tickets.id = :id", { id: ticketId });
      
        const ticket = await query.getOne();
      
        if (!ticket) {
          throw new Error('Ticket not found');
        }
      
        return ticket;
      }   

      async updateTicket(
        id: number,
        { price, scheduleId }: UpdateTicketParams
      ): Promise<Ticket | null> {
        const repo = this.db.getRepository(Ticket);
        const ticketFound = await repo.findOneBy({ id });
        if (ticketFound === null) return null;
      
        if (price) {
          ticketFound.price = price;
        }        
        if (scheduleId) {
          ticketFound.scheduleId = scheduleId;
        }

        const ticketUpdate = await repo.save(ticketFound);
        return ticketUpdate;
      }

async deleteTicket(id: number): Promise<Ticket | null> {
    const repo = this.db.getRepository(Ticket);
    const ticketFound = await repo.findOneBy({ id });
  
    if (!ticketFound) return null;
  
    await repo.remove(ticketFound);
    return ticketFound;
  }
}
