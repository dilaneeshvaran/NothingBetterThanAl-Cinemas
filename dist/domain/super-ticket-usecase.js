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
exports.SuperTicketUsecase = void 0;
const super_ticket_1 = require("../database/entities/super-ticket");
const schedule_usecase_1 = require("./schedule-usecase");
const database_1 = require("../database/database");
class SuperTicketUsecase {
    constructor(db) {
        this.db = db;
    }
    listSuperTickets(listSuperTicketParams) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = this.db.createQueryBuilder(super_ticket_1.SuperTicket, "supertickets");
            query.skip((listSuperTicketParams.page - 1) * listSuperTicketParams.limit);
            query.take(listSuperTicketParams.limit);
            const [superTickets, totalCount] = yield query.getManyAndCount();
            return {
                superTickets,
                totalCount,
            };
        });
    }
    getSuperTicketById(superTicketId) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = this.db.createQueryBuilder(super_ticket_1.SuperTicket, "supertickets");
            query.where("supertickets.id = :id", { id: superTicketId });
            const superTicket = yield query.getOne();
            if (!superTicket) {
                throw new Error('SuperTicket not found');
            }
            return superTicket;
        });
    }
    updateSuperTicket(id_1, _a) {
        return __awaiter(this, arguments, void 0, function* (id, { price, usesRemaining, usedSchedules }) {
            const repo = this.db.getRepository(super_ticket_1.SuperTicket);
            const superTicketFound = yield repo.findOne({ where: { id } });
            if (!superTicketFound)
                return null;
            if (price) {
                superTicketFound.price = price;
            }
            if (usesRemaining !== undefined) {
                superTicketFound.usesRemaining = usesRemaining;
            }
            if (usedSchedules) {
                superTicketFound.usedSchedules = usedSchedules;
            }
            const superTicketUpdate = yield repo.save(superTicketFound);
            return superTicketUpdate;
        });
    }
    bookSchedule(superTicketId, scheduleId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            const superTicket = yield this.getSuperTicketById(superTicketId);
            if (((_b = (_a = superTicket.usedSchedules) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0) >= 10) {
                throw new Error("Cannot book more than 10 schedules");
            }
            if (superTicket.usesRemaining <= 0) {
                throw new Error("No uses remaining");
            }
            superTicket.usedSchedules = ((_c = superTicket.usedSchedules) === null || _c === void 0 ? void 0 : _c.map(Number)) || [];
            scheduleId = Number(scheduleId); // Ensure scheduleId is a number
            if (superTicket.usedSchedules.includes(scheduleId)) {
                throw new Error("Schedule already booked");
            }
            // Check if schedule capacity is respected
            const scheduleUsecase = new schedule_usecase_1.ScheduleUsecase(database_1.AppDataSource);
            const schedule = yield scheduleUsecase.getScheduleById(scheduleId);
            const ticketsSold = yield scheduleUsecase.getTicketsSold(scheduleId);
            if (ticketsSold >= schedule.auditoriumCapacity) {
                throw new Error("Schedule is fully booked");
            }
            superTicket.usedSchedules.push(scheduleId);
            superTicket.usesRemaining--;
            const updatedSuperTicket = yield this.updateSuperTicket(superTicketId, {
                id: superTicketId,
                usesRemaining: superTicket.usesRemaining,
                usedSchedules: superTicket.usedSchedules
            });
            return updatedSuperTicket;
        });
    }
    validateSuperTicket(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const repo = this.db.getRepository(super_ticket_1.SuperTicket);
            const superTicket = yield repo.findOne({ where: { id } });
            if (!superTicket || !superTicket.usedSchedules) {
                console.log('No super tickets found');
                return null;
            }
            const scheduleUsecase = new schedule_usecase_1.ScheduleUsecase(database_1.AppDataSource);
            const currentTime = new Date();
            const currentTimeUTC = new Date(Date.UTC(currentTime.getFullYear(), currentTime.getMonth(), currentTime.getDate(), currentTime.getHours(), currentTime.getMinutes(), currentTime.getSeconds()));
            console.log(`Current time (UTC): ${currentTimeUTC.toISOString()}`);
            for (const id of superTicket.usedSchedules) {
                const schedule = yield scheduleUsecase.getScheduleById(id);
                if (!schedule)
                    continue;
                const startTime = new Date(schedule.date);
                const differenceInMinutes = Math.round((currentTimeUTC.getTime() - startTime.getTime()) / 60000);
                console.log(`Start time of schedule ${id}: ${startTime.toISOString()}`);
                console.log(`Difference in minutes: ${differenceInMinutes}`);
                if (differenceInMinutes >= -15 && differenceInMinutes <= 15) {
                    return true;
                }
            }
            return false;
        });
    }
    deleteSuperTicket(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const repo = this.db.getRepository(super_ticket_1.SuperTicket);
            const superTicketFound = yield repo.findOne({ where: { id } });
            if (!superTicketFound)
                return null;
            yield repo.remove(superTicketFound);
            return superTicketFound;
        });
    }
    getSuperTicketsByUserId(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const superTicketRepo = this.db.getRepository(super_ticket_1.SuperTicket);
            const superTickets = yield superTicketRepo.find({ where: { userId } });
            return superTickets;
        });
    }
}
exports.SuperTicketUsecase = SuperTicketUsecase;
