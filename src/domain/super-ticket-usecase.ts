import { DataSource, LessThanOrEqual, MoreThanOrEqual } from "typeorm";
import { SuperTicket } from "../database/entities/super-ticket";
import { ScheduleUsecase } from "./schedule-usecase";
import { AppDataSource } from "../database/database";

export interface ListSuperTicketParams {
    limit: number;
    page: number;
}

export interface UpdateSuperTicketParams {
    id: number;
    price?: number;
    usesRemaining?: number;
    usedSchedules?: number[];
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
        { price, usesRemaining, usedSchedules }: UpdateSuperTicketParams
    ): Promise<SuperTicket | null> {
        const repo = this.db.getRepository(SuperTicket);
        const superTicketFound = await repo.findOne({ where: { id } });
        if (!superTicketFound) return null;
    
        if (price) {
            superTicketFound.price = price;
        }
        if (usesRemaining !== undefined) {
            superTicketFound.usesRemaining = usesRemaining;
        }
        if (usedSchedules) {
            superTicketFound.usedSchedules = usedSchedules;
        }
    
        const superTicketUpdate = await repo.save(superTicketFound);
        return superTicketUpdate;
    }

    async bookSchedule(superTicketId: number, scheduleId: number) {
        const superTicket = await this.getSuperTicketById(superTicketId);
      
        if ((superTicket.usedSchedules?.length ?? 0) >= 10) {
          throw new Error("Cannot book more than 10 schedules");
        }
      
        if (superTicket.usesRemaining <= 0) {
          throw new Error("No uses remaining");
        }
      
        superTicket.usedSchedules = superTicket.usedSchedules?.map(Number) || [];
        scheduleId = Number(scheduleId); // Ensure scheduleId is a number
        if (superTicket.usedSchedules.includes(scheduleId)) {
          throw new Error("Schedule already booked");
        }
      
        // Check if schedule capacity is respected
        const scheduleUsecase = new ScheduleUsecase(AppDataSource);
        const schedule = await scheduleUsecase.getScheduleById(scheduleId);
        const ticketsSold = await scheduleUsecase.getTicketsSold(scheduleId);
        if (ticketsSold >= schedule.auditoriumCapacity) {
          throw new Error("Schedule is fully booked");
        }
      
        superTicket.usedSchedules.push(scheduleId);
        superTicket.usesRemaining--;
      
        const updatedSuperTicket = await this.updateSuperTicket(superTicketId, {
          id: superTicketId,
          usesRemaining: superTicket.usesRemaining,
          usedSchedules: superTicket.usedSchedules
        });
      
        return updatedSuperTicket;
      }

      async validateSuperTicket(id: number): Promise<boolean | null> {
        const repo = this.db.getRepository(SuperTicket);
        const superTicket = await repo.findOne({ where: { id } });
      
        if (!superTicket || !superTicket.usedSchedules) {
          console.log('No super tickets found');
          return null;
        }
    
        const scheduleUsecase = new ScheduleUsecase(AppDataSource);
        const currentTime = new Date();
        const currentTimeUTC = new Date(Date.UTC(currentTime.getFullYear(), currentTime.getMonth(), currentTime.getDate(), currentTime.getHours(), currentTime.getMinutes(), currentTime.getSeconds()));
    
        console.log(`Current time (UTC): ${currentTimeUTC.toISOString()}`);
    
        for (const id of superTicket.usedSchedules) {
            const schedule = await scheduleUsecase.getScheduleById(id);
            if (!schedule) continue;
    
            const startTime = new Date(schedule.date);
            const differenceInMinutes = Math.round((currentTimeUTC.getTime() - startTime.getTime()) / 60000);
    
            console.log(`Start time of schedule ${id}: ${startTime.toISOString()}`);
            console.log(`Difference in minutes: ${differenceInMinutes}`);
    
            if (differenceInMinutes >= -15 && differenceInMinutes <= 15) {
                return true;
            }
        }
    
        return false;
    }
    
    async deleteSuperTicket(id: number): Promise<SuperTicket | null> {
        const repo = this.db.getRepository(SuperTicket);
        const superTicketFound = await repo.findOne({ where: { id } });
    
        if (!superTicketFound) return null;
    
        await repo.remove(superTicketFound);
        return superTicketFound;
    }

    async getSuperTicketsByUserId(userId: number) {
        const superTicketRepo = this.db.getRepository(SuperTicket);
        const superTickets = await superTicketRepo.find({ where: { userId } });
        return superTickets;
      }
}