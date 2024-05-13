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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initMovieRoutes = void 0;
const authMiddleware_1 = require("../middlewares/authMiddleware");
const movie_validator_1 = require("../validators/movie-validator");
const generate_validation_message_1 = require("../validators/generate-validation-message");
const database_1 = require("../../database/database");
const movie_1 = require("../../database/entities/movie");
const movie_usecase_1 = require("../../domain/movie-usecase");
const schedule_usecase_1 = require("../../domain/schedule-usecase");
const moment_1 = __importDefault(require("moment"));
const initMovieRoutes = (app) => {
    app.get("/health", (req, res) => {
        res.send({ message: "hello world" });
    });
    /**
     * @openapi
     * /movies:
     *   get:
     *     tags:
     *       - Movies
     *     description: List movies with pagination
     *     parameters:
     *       - name: page
     *         in: query
     *         required: false
     *         description: Page number for pagination
     *         schema:
     *           type: integer
     *       - name: limit
     *         in: query
     *         required: false
     *         description: Number of movies per page
     *         schema:
     *           type: integer
     *     responses:
     *       200:
     *         description: Movies retrieved successfully
     *       400:
     *         description: Validation error
     *       500:
     *         description: Internal server error
     */
    app.get("/movies", authMiddleware_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const validation = movie_validator_1.listValidation.validate(req.query);
        if (validation.error) {
            res
                .status(400)
                .send((0, generate_validation_message_1.generateValidationErrorMessage)(validation.error.details));
            return;
        }
        const listMovieReq = validation.value;
        let limit = 20;
        if (listMovieReq.limit) {
            limit = listMovieReq.limit;
        }
        const page = (_a = listMovieReq.page) !== null && _a !== void 0 ? _a : 1;
        try {
            const movieUsecase = new movie_usecase_1.MovieUsecase(database_1.AppDataSource);
            const listMovie = yield movieUsecase.listMovie(Object.assign(Object.assign({}, listMovieReq), { page,
                limit }));
            res.status(200).send(listMovie);
        }
        catch (error) {
            console.log(error);
            res.status(500).send({ error: "Internal server error" });
        }
    }));
    /**
     * @openapi
     * /movies/{movieId}:
     *   get:
     *     tags:
     *       - Movies
     *     description: Get a specific movie by its ID and its associated schedules
     *     parameters:
     *       - name: movieId
     *         in: path
     *         required: true
     *         description: ID of the movie
     *         schema:
     *           type: integer
     *     responses:
     *       200:
     *         description: Movie retrieved successfully
     *       404:
     *         description: Movie not found
     *       500:
     *         description: Internal server error
     */
    app.get("/movies/:movieId", authMiddleware_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const { movieId } = req.params;
        try {
            const movieUsecase = new movie_usecase_1.MovieUsecase(database_1.AppDataSource);
            const scheduleUsecase = new schedule_usecase_1.ScheduleUsecase(database_1.AppDataSource);
            const movie = yield movieUsecase.getMovieById(Number(movieId));
            const scheduleIds = yield scheduleUsecase.getSchedulesByMovieId(Number(movieId));
            if (movie) {
                res.status(200).send({ movie, scheduleIds });
            }
            else {
                res.status(404).send({ error: "Movie not found" });
            }
        }
        catch (error) {
            console.log(error);
            res.status(500).send({ error: "Internal server error" });
        }
    }));
    /**
     * @openapi
     * /movies/{movieId}/schedules/{startDate}/{endDate}:
     *   get:
     *     tags:
     *       - Movies
     *     summary: Get a movie and its schedules between two dates by movie ID
     *     parameters:
     *       - in: path
     *         name: movieId
     *         required: true
     *         schema:
     *           type: integer
     *         description: The movie ID
     *       - in: path
     *         name: startDate
     *         required: true
     *         schema:
     *           type: string
     *           format: date
     *         description: The start date
     *       - in: path
     *         name: endDate
     *         required: true
     *         schema:
     *           type: string
     *           format: date
     *         description: The end date
     *     responses:
     *       200:
     *         description: The movie and its schedules were found
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 movie:
     *                   type: object
     *                   properties:
     *                     id:
     *                       type: integer
     *                 schedules:
     *                   type: array
     *                   items:
     *                     type: object
     *                     properties:
     *                       id:
     *                         type: integer
     *       404:
     *         description: The movie was not found
     *       500:
     *         description: Internal server error
     */
    app.get("/movies/:movieId/schedules/:startDate/:endDate", authMiddleware_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const { movieId, startDate, endDate } = req.params;
        if (isNaN(Date.parse(startDate)) || isNaN(Date.parse(endDate))) {
            res.status(400).send({ error: "Invalid date format" });
            return;
        }
        if (!(0, moment_1.default)(startDate, 'YYYY-MM-DD', true).isValid() || !(0, moment_1.default)(endDate, 'YYYY-MM-DD', true).isValid()) {
            res.status(400).send({ error: "Invalid date format" });
            return;
        }
        try {
            const movieUsecase = new movie_usecase_1.MovieUsecase(database_1.AppDataSource);
            const movie = yield movieUsecase.getMovieById(Number(movieId));
            const schedules = yield movieUsecase.getMovieScheduleBetween(Number(movieId), startDate, endDate);
            if (movie) {
                res.status(200).send({ movie, schedules });
            }
            else {
                res.status(404).send({ error: "Movie not found" });
            }
        }
        catch (error) {
            console.log(error);
            res.status(500).send({ error: "Internal server error" });
        }
    }));
    /**
     * @openapi
     * /movies:
     *   post:
     *     tags:
     *       - Movies
     *     description: Create a new movie
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/definitions/Movie'
     *     responses:
     *       201:
     *         description: Movie created successfully
     *       400:
     *         description: Validation error
     *       500:
     *         description: Internal server error
     */
    app.post("/movies", authMiddleware_1.authenticateToken, authMiddleware_1.authorizeAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const validation = movie_validator_1.movieValidation.validate(req.body);
        if (validation.error) {
            res
                .status(400)
                .send((0, generate_validation_message_1.generateValidationErrorMessage)(validation.error.details));
            return;
        }
        const movieRequest = validation.value;
        const movieRepo = database_1.AppDataSource.getRepository(movie_1.Movie);
        try {
            const movieCreated = yield movieRepo.save(movieRequest);
            res.status(201).send(movieCreated);
        }
        catch (error) {
            res.status(500).send({ error: "Internal error" });
        }
    }));
    /**
     * @openapi
     * /movies/{id}:
     *   patch:
     *     tags:
     *       - Movies
     *     description: Update a movie
     *     parameters:
     *       - name: id
     *         in: path
     *         required: true
     *         description: ID of the movie to update
     *         schema:
     *           type: integer
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/definitions/UpdateMovie'
     *     responses:
     *       200:
     *         description: Movie updated successfully
     *       400:
     *         description: Validation error
     *       404:
     *         description: Movie not found
     *       500:
     *         description: Internal server error
     */
    app.patch("/movies/:id", authMiddleware_1.authenticateToken, authMiddleware_1.authorizeAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const validation = movie_validator_1.updateMovieValidation.validate(Object.assign(Object.assign({}, req.params), req.body));
        if (validation.error) {
            res
                .status(400)
                .send((0, generate_validation_message_1.generateValidationErrorMessage)(validation.error.details));
            return;
        }
        const updateMovieReq = validation.value;
        try {
            const movieUsecase = new movie_usecase_1.MovieUsecase(database_1.AppDataSource);
            const updatedMovie = yield movieUsecase.updateMovie(updateMovieReq.id, Object.assign({}, updateMovieReq));
            if (updatedMovie === null) {
                res.status(404).send({
                    error: `movie ${updateMovieReq.id} not found`,
                });
                return;
            }
            res.status(200).send(updatedMovie);
        }
        catch (error) {
            console.log(error);
            res.status(500).send({ error: "Internal error" });
        }
    }));
    /**
     * @openapi
     * /movies/{id}:
     *   delete:
     *     tags:
     *       - Movies
     *     description: Delete a movie
     *     parameters:
     *       - name: id
     *         in: path
     *         required: true
     *         description: ID of the movie to delete
     *         schema:
     *           type: integer
     *     responses:
     *       200:
     *         description: Movie deleted successfully
     *       400:
     *         description: Validation error
     *       404:
     *         description: Movie not found
     *       500:
     *         description: Internal server error
     */
    app.delete("/movies/:id", authMiddleware_1.authenticateToken, authMiddleware_1.authorizeAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const validation = movie_validator_1.deleteMovieValidation.validate(req.params);
        if (validation.error) {
            res
                .status(400)
                .send((0, generate_validation_message_1.generateValidationErrorMessage)(validation.error.details));
            return;
        }
        try {
            const movieUsecase = new movie_usecase_1.MovieUsecase(database_1.AppDataSource);
            const deletedMovie = yield movieUsecase.deleteMovie(Number(req.params.id));
            if (deletedMovie) {
                res.status(200).send({
                    message: "Movie removed successfully",
                    movie: deletedMovie,
                });
            }
            else {
                res.status(404).send({ message: "Movie not found" });
            }
        }
        catch (error) {
            res.status(500).send({ message: "Internal server error" });
        }
    }));
    /**
     * @openapi
     * definitions:
     *   Movie:
     *     type: object
     *     properties:
     *       title:
     *         type: string
     *         description: The title of the movie
     *       description:
     *         type: string
     *         description: The description of the movie
     *       imageUrl:
     *         type: string
     *         description: The URL of the movie's image
     *       duration:
     *         type: integer
     *         description: The duration of the movie in minutes
     *     required:
     *       - title
     *       - description
     *       - duration
     */
    /**
     * @openapi
     * definitions:
     *   UpdateMovie:
     *     type: object
     *     properties:
     *       title:
     *         type: string
     *         description: The title of the movie
     *       description:
     *         type: string
     *         description: The description of the movie
     *       imageUrl:
     *         type: string
     *         description: The URL of the movie's image
     *       duration:
     *         type: integer
     *         description: The duration of the movie in minutes
     */
};
exports.initMovieRoutes = initMovieRoutes;
