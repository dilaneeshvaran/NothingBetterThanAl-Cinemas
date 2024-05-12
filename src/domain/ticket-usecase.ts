import { DataSource } from "typeorm";
import { Ticket } from "../database/entities/ticket";
import { ScheduleUsecase } from "./schedule-usecase";
import { AppDataSource } from "../database/database";
import { User } from "../database/entities/user";
import { Auditorium } from "../database/entities/auditorium";
import { Schedule } from "../database/entities/schedule";

export interface ListTicket {
    limit: number;
    page: number;
  }

  export interface UpdateTicketParams {
    id:number;
    price?: number;
    scheduleId?:number,
    used?:boolean
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

      async getTicketById(ticketId: number): Promise<Ticket | null> {
        const query = this.db.createQueryBuilder(Ticket, "tickets");
      
        query.where("tickets.id = :id", { id: ticketId });
      
        const ticket = await query.getOne();
      
        if (!ticket) {
          return null;
        }
      
        return ticket;
    }

    async updateTicket(
      id: number,
      { price, scheduleId, used }: UpdateTicketParams
    ): Promise<Ticket | null> {
      const repo = this.db.getRepository(Ticket);
      const ticketFound = await repo.findOneBy({ id });
      if (ticketFound === null) return null;
    
      if (price !== undefined) {
        ticketFound.price = price;
      }
      if (scheduleId !== undefined) {
        ticketFound.scheduleId = scheduleId;
      }
      if (used !== undefined) {
        ticketFound.used = used;
      }
    
      const ticketUpdate = await repo.save(ticketFound);
      return ticketUpdate;
    }

      
      async validateTicket(id: number): Promise<boolean> {
        const repo = this.db.getRepository(Ticket);
        const ticket = await repo.findOne({ where: { id } });
    
        if (!ticket || !ticket.scheduleId) {
            return false;
        }
    
        const scheduleUsecase = new ScheduleUsecase(AppDataSource);
        const currentTime = new Date();
        const currentTimeUTC = new Date(Date.UTC(currentTime.getFullYear(), currentTime.getMonth(), currentTime.getDate(), currentTime.getHours(), currentTime.getMinutes(), currentTime.getSeconds()));
    
        console.log(`Current time (UTC): ${currentTimeUTC.toISOString()}`);
    
        const schedule = await scheduleUsecase.getScheduleById(ticket.scheduleId);
        if (!schedule) return false;
    
        const startTime = new Date(schedule.date);
        const differenceInMinutes = Math.round((currentTimeUTC.getTime() - startTime.getTime()) / 60000);
    
        console.log(`Start time of schedule ${ticket.scheduleId}: ${startTime.toISOString()}`);
        console.log(`Difference in minutes: ${differenceInMinutes}`);
    
        if (differenceInMinutes >= -15 && differenceInMinutes <= 15) {
            return true;
        }
    
        return false;
    }

async deleteTicket(id: number): Promise<Ticket | null> {
    const repo = this.db.getRepository(Ticket);
    const ticketFound = await repo.findOneBy({ id });
  
    if (!ticketFound) return null;
  
    await repo.remove(ticketFound);
    return ticketFound;
  }
  
    async checkScheduleExists(scheduleId: number) {
      const scheduleRepo = this.db.getRepository(Schedule);
      const schedule = await scheduleRepo.findOne({ where: { id: scheduleId } });
      if (!schedule) {
        throw new Error("Schedule does not exist");
      }
      return schedule;
    }
  
    async checkAuditoriumCapacity(schedule: any) {
      const auditoriumRepo = this.db.getRepository(Auditorium);
      const auditorium = await auditoriumRepo.findOne({ where: { id: schedule.auditoriumId } });
      if (!auditorium) {
        throw new Error("Auditorium does not exist");
      }

      const scheduleUsecase = new ScheduleUsecase(AppDataSource);
      const ticketsSold = await scheduleUsecase.getTicketsSold(schedule.id);
      if (ticketsSold >= auditorium.capacity) {
        throw new Error("Auditorium capacity has been reached");
      }
    }
  
    async fetchUserAndCheckBalance(userId: number, ticketPrice: number) {
      const userRepo = this.db.getRepository(User);
      const user = await userRepo.findOne({ where: { id: userId } });
      if (!user) {
        throw new Error("User does not exist");
      }
      if (user.balance < ticketPrice) {
        throw new Error("Insufficient balance");
      }
      return user;
    }
  
    async updateUserBalance(user: any, ticketPrice: number) {
      user.balance -= ticketPrice;
      const userRepo = this.db.getRepository(User);
      await userRepo.save(user);
    }
  
    async saveTicket(ticketRequest: any) {
      const ticketRepo = this.db.getRepository(Ticket);
      const ticketCreated = await ticketRepo.save(ticketRequest);
      return ticketCreated;
    }
    async getTicketsByUserId(userId: number) {
      const ticketRepo = this.db.getRepository(Ticket);
      const tickets = await ticketRepo.find({ where: { userId } });
      return tickets;
    }
}
