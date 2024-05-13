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
exports.ScheduleUsecase = void 0;
const schedule_1 = require("../database/entities/schedule");
const movie_1 = require("../database/entities/movie");
const ticket_1 = require("../database/entities/ticket");
const auditorium_1 = require("../database/entities/auditorium");
const super_ticket_1 = require("../database/entities/super-ticket");
class ScheduleUsecase {
    constructor(db) {
        this.db = db;
    }
    listSchedule(listSchedule) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = this.db.createQueryBuilder(schedule_1.Schedule, "schedules");
            query.skip((listSchedule.page - 1) * listSchedule.limit);
            query.take(listSchedule.limit);
            const [schedules, totalCount] = yield query.getManyAndCount();
            return {
                schedules,
                totalCount,
            };
        });
    }
    getScheduleById(scheduleId) {
        return __awaiter(this, void 0, void 0, function* () {
            const scheduleQuery = this.db.createQueryBuilder(schedule_1.Schedule, "schedules");
            scheduleQuery.where("schedules.id = :id", { id: scheduleId });
            const schedule = yield scheduleQuery.getOne();
            if (!schedule) {
                throw new Error('Schedule not found');
            }
            const auditoriumQuery = this.db.createQueryBuilder(auditorium_1.Auditorium, "auditoriums");
            auditoriumQuery.where("auditoriums.id = :id", { id: schedule.auditoriumId });
            const auditorium = yield auditoriumQuery.getOne();
            if (!auditorium) {
                throw new Error('Auditorium not found');
            }
            const ticketsSold = yield this.getTicketsSold(scheduleId);
            return Object.assign(Object.assign({}, schedule), { auditoriumCapacity: auditorium.capacity, ticketsSold: ticketsSold });
        });
    }
    getTicketsSold(scheduleId) {
        return __awaiter(this, void 0, void 0, function* () {
            const ticketQuery = this.db.createQueryBuilder(ticket_1.Ticket, "tickets");
            ticketQuery.where("tickets.scheduleId = :id", { id: scheduleId });
            const superTicketQuery = this.db.createQueryBuilder(super_ticket_1.SuperTicket, "supertickets");
            superTicketQuery.where("FIND_IN_SET(:id, `supertickets`.`usedSchedules`)", { id: scheduleId });
            const ticketsSold = (yield ticketQuery.getCount()) + (yield superTicketQuery.getCount());
            return ticketsSold;
        });
    }
    getScheduleBetween(startDate, endDate) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = this.db.createQueryBuilder(schedule_1.Schedule, "schedules");
            const ticketRepo = this.db.getRepository(ticket_1.Ticket);
            query.where("schedules.date >= :startDate AND schedules.date <= :endDate", { startDate, endDate });
            const schedules = yield query.getMany();
            if (!schedules || schedules.length === 0) {
                throw new Error('No schedules found between the specified dates');
            }
            return Promise.all(schedules.map((schedule) => __awaiter(this, void 0, void 0, function* () {
                const tickets = yield ticketRepo.find({ where: { scheduleId: schedule.id } });
                return {
                    schedule,
                    ticketsSold: tickets.length
                };
            })));
        });
    }
    updateSchedule(id_1, _a) {
        return __awaiter(this, arguments, void 0, function* (id, { date, movieId, auditoriumId }) {
            const repo = this.db.getRepository(schedule_1.Schedule);
            const scheduleFound = yield repo.findOneBy({ id });
            if (scheduleFound === null)
                return null;
            if (date) {
                scheduleFound.date = date;
            }
            if (movieId) {
                scheduleFound.movieId = movieId;
            }
            if (auditoriumId) {
                scheduleFound.auditoriumId = auditoriumId;
            }
            if (yield this.doesOverlap(scheduleFound)) {
                throw new Error("Overlapping schedules are not allowed");
            }
            const scheduleUpdate = yield repo.save(scheduleFound);
            return scheduleUpdate;
        });
    }
    doesOverlap(schedule) {
        return __awaiter(this, void 0, void 0, function* () {
            const repo = this.db.getRepository(schedule_1.Schedule);
            let scheduleDuration = 0;
            const movieRepo = this.db.getRepository(movie_1.Movie);
            const movie = yield movieRepo.findOne({ where: { id: schedule.movieId } });
            if (movie) {
                const movieDuration = movie.duration;
                scheduleDuration = movieDuration + 30; // movie duration + cleaning & publicity interval
            }
            // calculate end time, duration here is in minutes
            const endTime = new Date(schedule.date.getTime() + scheduleDuration * 60000);
            // check for overlap
            const overlappingSchedules = yield repo.createQueryBuilder("schedule")
                .innerJoin(movie_1.Movie, "movie", "movie.id = schedule.movieId")
                .where("schedule.movieId = :movieId", { movieId: schedule.movieId })
                .andWhere("schedule.id != :id", { id: schedule.id }) // ignore when updating
                .andWhere("schedule.date <= :endTime AND DATE_ADD(schedule.date, INTERVAL movie.duration + 30 MINUTE) >= :startTime", { endTime: endTime, startTime: schedule.date })
                .getMany();
            return overlappingSchedules.length > 0;
        });
    }
    isCorrectDate(schedule) {
        const now = new Date();
        // remove time part from the date
        now.setHours(0, 0, 0, 0);
        const scheduleDate = new Date(schedule.date);
        scheduleDate.setHours(0, 0, 0, 0);
        return scheduleDate >= now;
    }
    deleteSchedule(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const repo = this.db.getRepository(schedule_1.Schedule);
            const scheduleFound = yield repo.findOneBy({ id });
            if (!scheduleFound)
                return null;
            yield repo.remove(scheduleFound);
            return scheduleFound;
        });
    }
    getSchedulesByMovieId(movieId) {
        return __awaiter(this, void 0, void 0, function* () {
            const repo = this.db.getRepository(schedule_1.Schedule);
            const schedules = yield repo.find({
                select: ["id"],
                where: { movieId }
            });
            return schedules.map(schedule => schedule.id);
        });
    }
}
exports.ScheduleUsecase = ScheduleUsecase;
