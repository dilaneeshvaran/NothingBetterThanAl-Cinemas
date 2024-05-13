"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TicketUsecase = void 0;
const ticket_1 = require("../database/entities/ticket");
const schedule_usecase_1 = require("./schedule-usecase");
const database_1 = require("../database/database");
const user_1 = require("../database/entities/user");
const auditorium_1 = require("../database/entities/auditorium");
const schedule_1 = require("../database/entities/schedule");
class TicketUsecase {
    constructor(db) {
        this.db = db;
    }
    listTicket(listTicket) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = this.db.createQueryBuilder(ticket_1.Ticket, "tickets");
            query.skip((listTicket.page - 1) * listTicket.limit);
            query.take(listTicket.limit);
            const [tickets, totalCount] = yield query.getManyAndCount();
            return {
                tickets,
                totalCount,
            };
        });
    }
    getTicketById(ticketId) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = this.db.createQueryBuilder(ticket_1.Ticket, "tickets");
            query.where("tickets.id = :id", { id: ticketId });
            const ticket = yield query.getOne();
            if (!ticket) {
                return null;
            }
            return ticket;
        });
    }
    updateTicket(id_1, _a) {
        return __awaiter(this, arguments, void 0, function* (id, { price, scheduleId, used }) {
            const repo = this.db.getRepository(ticket_1.Ticket);
            const ticketFound = yield repo.findOneBy({ id });
            if (ticketFound === null)
                return null;
            if (price !== undefined) {
                ticketFound.price = price;
            }
            if (scheduleId !== undefined) {
                ticketFound.scheduleId = scheduleId;
            }
            if (used !== undefined) {
                ticketFound.used = used;
            }
            const ticketUpdate = yield repo.save(ticketFound);
            return ticketUpdate;
        });
    }
    validateTicket(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const repo = this.db.getRepository(ticket_1.Ticket);
            const ticket = yield repo.findOne({ where: { id } });
            if (!ticket || !ticket.scheduleId) {
                return false;
            }
            const scheduleUsecase = new schedule_usecase_1.ScheduleUsecase(database_1.AppDataSource);
            const currentTime = new Date();
            const currentTimeUTC = new Date(Date.UTC(currentTime.getFullYear(), currentTime.getMonth(), currentTime.getDate(), currentTime.getHours(), currentTime.getMinutes(), currentTime.getSeconds()));
            console.log(`Current time (UTC): ${currentTimeUTC.toISOString()}`);
            const schedule = yield scheduleUsecase.getScheduleById(ticket.scheduleId);
            if (!schedule)
                return false;
            const startTime = new Date(schedule.date);
            const differenceInMinutes = Math.round((currentTimeUTC.getTime() - startTime.getTime()) / 60000);
            console.log(`Start time of schedule ${ticket.scheduleId}: ${startTime.toISOString()}`);
            console.log(`Difference in minutes: ${differenceInMinutes}`);
            if (differenceInMinutes >= -15 && differenceInMinutes <= 15) {
                return true;
            }
            return false;
        });
    }
    deleteTicket(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const repo = this.db.getRepository(ticket_1.Ticket);
            const ticketFound = yield repo.findOneBy({ id });
            if (!ticketFound)
                return null;
            yield repo.remove(ticketFound);
            return ticketFound;
        });
    }
    checkScheduleExists(scheduleId) {
        return __awaiter(this, void 0, void 0, function* () {
            const scheduleRepo = this.db.getRepository(schedule_1.Schedule);
            const schedule = yield scheduleRepo.findOne({ where: { id: scheduleId } });
            if (!schedule) {
                throw new Error("Schedule does not exist");
            }
            return schedule;
        });
    }
    checkAuditoriumCapacity(schedule) {
        return __awaiter(this, void 0, void 0, function* () {
            const auditoriumRepo = this.db.getRepository(auditorium_1.Auditorium);
            const auditorium = yield auditoriumRepo.findOne({ where: { id: schedule.auditoriumId } });
            if (!auditorium) {
                throw new Error("Auditorium does not exist");
            }
            const scheduleUsecase = new schedule_usecase_1.ScheduleUsecase(database_1.AppDataSource);
            const ticketsSold = yield scheduleUsecase.getTicketsSold(schedule.id);
            if (ticketsSold >= auditorium.capacity) {
                throw new Error("Auditorium capacity has been reached");
            }
        });
    }
    fetchUserAndCheckBalance(userId, ticketPrice) {
        return __awaiter(this, void 0, void 0, function* () {
            const userRepo = this.db.getRepository(user_1.User);
            const user = yield userRepo.findOne({ where: { id: userId } });
            if (!user) {
                throw new Error("User does not exist");
            }
            if (user.balance < ticketPrice) {
                throw new Error("Insufficient balance");
            }
            return user;
        });
    }
    updateUserBalance(user, ticketPrice) {
        return __awaiter(this, void 0, void 0, function* () {
            user.balance -= ticketPrice;
            const userRepo = this.db.getRepository(user_1.User);
            yield userRepo.save(user);
        });
    }
    saveTicket(ticketRequest) {
        return __awaiter(this, void 0, void 0, function* () {
            const ticketRepo = this.db.getRepository(ticket_1.Ticket);
            const ticketCreated = yield ticketRepo.save(ticketRequest);
            return ticketCreated;
        });
    }
    getTicketsByUserId(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const ticketRepo = this.db.getRepository(ticket_1.Ticket);
            const tickets = yield ticketRepo.find({ where: { userId } });
            return tickets;
        });
    }
}
exports.TicketUsecase = TicketUsecase;
