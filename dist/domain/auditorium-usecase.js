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
exports.AuditoriumUsecase = void 0;
const auditorium_1 = require("../database/entities/auditorium");
const schedule_1 = require("../database/entities/schedule");
const typeorm_1 = require("typeorm");
const ticket_1 = require("../database/entities/ticket");
class AuditoriumUsecase {
    constructor(db) {
        this.db = db;
    }
    listAuditorium(listAuditoriums) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = this.db.createQueryBuilder(auditorium_1.Auditorium, "auditoriums");
            //query.where("auditoriums.maintenance = :maintenance", { maintenance: false });
            query.skip((listAuditoriums.page - 1) * listAuditoriums.limit);
            query.take(listAuditoriums.limit);
            const [auditoriums, totalCount] = yield query.getManyAndCount();
            return {
                auditoriums,
                totalCount,
            };
        });
    }
    getAuditoriumById(auditoriumId) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = this.db.createQueryBuilder(auditorium_1.Auditorium, "auditoriums");
            query.where("auditoriums.id = :id", { id: auditoriumId });
            const auditorium = yield query.getOne();
            if (!auditorium) {
                throw new Error('Auditorium not found');
            }
            return auditorium;
        });
    }
    updateAuditorium(id_1, _a) {
        return __awaiter(this, arguments, void 0, function* (id, { name, description, type, imageUrl, capacity, handicapAccessible, maintenance }) {
            const repo = this.db.getRepository(auditorium_1.Auditorium);
            const auditoriumfound = yield repo.findOneBy({ id });
            if (auditoriumfound === null)
                return null;
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
            const auditoriumUpdate = yield repo.save(auditoriumfound);
            return auditoriumUpdate;
        });
    }
    deleteAuditoriumCollection(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const repo = this.db.getRepository(auditorium_1.Auditorium);
            const auditoriumFound = yield repo.findOneBy({ id });
            if (!auditoriumFound)
                return null;
            const auditoriumCount = yield repo.count();
            if (auditoriumCount <= 10) {
                throw new Error("At least 10 auditoriums must be present");
            }
            yield repo.remove(auditoriumFound);
            return auditoriumFound;
        });
    }
    getAuditoriumSchedule(auditoriumId, startDate) {
        return __awaiter(this, void 0, void 0, function* () {
            const scheduleRepo = this.db.getRepository(schedule_1.Schedule);
            const ticketRepo = this.db.getRepository(ticket_1.Ticket);
            // To get the schedule for the 7 days following the startDate
            const endDate = new Date();
            endDate.setDate(startDate.getDate() + 7);
            const schedules = yield scheduleRepo.find({
                where: {
                    auditoriumId: auditoriumId,
                    date: (0, typeorm_1.Between)(startDate, endDate)
                }
            });
            return Promise.all(schedules.map((schedule) => __awaiter(this, void 0, void 0, function* () {
                const tickets = yield ticketRepo.find({ where: { scheduleId: schedule.id } });
                return {
                    schedule,
                    ticketsSold: tickets.length
                };
            })));
        });
    }
}
exports.AuditoriumUsecase = AuditoriumUsecase;
