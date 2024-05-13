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
exports.MovieUsecase = void 0;
const movie_1 = require("../database/entities/movie");
const schedule_1 = require("../database/entities/schedule");
const ticket_1 = require("../database/entities/ticket");
class MovieUsecase {
    constructor(db) {
        this.db = db;
    }
    listMovie(listMovie) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = this.db.createQueryBuilder(movie_1.Movie, "movies");
            query.skip((listMovie.page - 1) * listMovie.limit);
            query.take(listMovie.limit);
            const [movies, totalCount] = yield query.getManyAndCount();
            return {
                movies,
                totalCount,
            };
        });
    }
    getMovieById(movieId) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = this.db.createQueryBuilder(movie_1.Movie, "movies");
            query.where("movies.id = :id", { id: movieId });
            const movie = yield query.getOne();
            if (!movie) {
                throw new Error('Movie not found');
            }
            return movie;
        });
    }
    updateMovie(id_1, _a) {
        return __awaiter(this, arguments, void 0, function* (id, { description, imageUrl, duration }) {
            const repo = this.db.getRepository(movie_1.Movie);
            const movieFound = yield repo.findOneBy({ id });
            if (movieFound === null)
                return null;
            if (description) {
                movieFound.description = description;
            }
            if (imageUrl) {
                movieFound.imageUrl = imageUrl;
            }
            if (duration) {
                movieFound.duration = duration;
            }
            const movieUpdate = yield repo.save(movieFound);
            return movieUpdate;
        });
    }
    deleteMovie(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const repo = this.db.getRepository(movie_1.Movie);
            const movieFound = yield repo.findOneBy({ id });
            if (!movieFound)
                return null;
            yield repo.remove(movieFound);
            return movieFound;
        });
    }
    getMovieScheduleBetween(movieId, startDate, endDate) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = this.db.createQueryBuilder(schedule_1.Schedule, "schedules");
            const ticketRepo = this.db.getRepository(ticket_1.Ticket);
            query.where("schedules.movieId = :movieId AND schedules.date >= :startDate AND schedules.date <= :endDate", { movieId, startDate, endDate });
            const schedules = yield query.getMany();
            if (!schedules || schedules.length === 0) {
                throw new Error('No schedules found for the specified movie between the specified dates');
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
}
exports.MovieUsecase = MovieUsecase;
