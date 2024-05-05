import { DataSource, LessThanOrEqual, MoreThanOrEqual } from "typeorm";
import { Ticket, TicketType } from "../database/entities/ticket";

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

    async createTicket(ticketData: Partial<Ticket>): Promise<Ticket> {
      const ticketRepo = this.db.getRepository(Ticket);
    
      if (ticketData.type === TicketType.NORMAL) {
        if (!ticketData.scheduleId) {
          throw new Error('scheduleId is required for normal tickets');
        }
    
        ticketData = {
          ...ticketData,
          remainingUses: 1,
          usedSchedules: undefined
        };
      } else if (ticketData.type === TicketType.SUPER) {
        const { scheduleId, ...superTicketData } = ticketData;
        ticketData = superTicketData;
      }
    
      const ticket = ticketRepo.create(ticketData);
      await ticketRepo.save(ticket);
    
      return ticket;
    }

    async listTicket(
      listTicket: ListTicket
    ): Promise<{ tickets: Ticket[]; totalCount: number }> {
      const query = this.db.createQueryBuilder(Ticket, "tickets");
      
      query.skip((listTicket.page - 1) * listTicket.limit);
      query.take(listTicket.limit);
  
      const [tickets, totalCount] = await query.getManyAndCount();
  
      // Map over the tickets and conditionally include remainingUses and usedSchedules
      const modifiedTickets = tickets.map(ticket => {
        if (ticket.type === TicketType.SUPER) {
          return ticket;
        } else {
          // For normal tickets, set remainingUses and usedSchedules to undefined
          const { remainingUses, usedSchedules, ...rest } = ticket;
          return rest;
        }
      });
  
      return {
        tickets: modifiedTickets,
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
        { price,movieId, scheduleId }: UpdateTicketParams
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
