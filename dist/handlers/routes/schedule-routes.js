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
exports.initScheduleRoutes = void 0;
const authMiddleware_1 = require("../middlewares/authMiddleware");
const schedule_validator_1 = require("../validators/schedule-validator");
const generate_validation_message_1 = require("../validators/generate-validation-message");
const database_1 = require("../../database/database");
const schedule_1 = require("../../database/entities/schedule");
const schedule_usecase_1 = require("../../domain/schedule-usecase");
const movie_1 = require("../../database/entities/movie");
const auditorium_1 = require("../../database/entities/auditorium");
const initScheduleRoutes = (app) => {
    app.get("/health", (req, res) => {
        res.send({ message: "hello world" });
    });
    /**
       * @openapi
       * /schedules:
       *   get:
       *     tags:
       *       - Schedules
       *     description: Returns all schedules
       *     responses:
       *       200:
       *         description: Successful operation
       *       400:
       *         description: Validation error
       *       500:
       *         description: Internal server error
       */
    app.get("/schedules", authMiddleware_1.authenticateToken, authMiddleware_1.authorizeAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const validation = schedule_validator_1.listValidation.validate(req.query);
        if (validation.error) {
            res
                .status(400)
                .send((0, generate_validation_message_1.generateValidationErrorMessage)(validation.error.details));
            return;
        }
        const listScheduleReq = validation.value;
        let limit = 20;
        if (listScheduleReq.limit) {
            limit = listScheduleReq.limit;
        }
        const page = (_a = listScheduleReq.page) !== null && _a !== void 0 ? _a : 1;
        try {
            const scheduleUsecase = new schedule_usecase_1.ScheduleUsecase(database_1.AppDataSource);
            const listSchedule = yield scheduleUsecase.listSchedule(Object.assign(Object.assign({}, listScheduleReq), { page,
                limit }));
            res.status(200).send(listSchedule);
        }
        catch (error) {
            console.log(error);
            res.status(500).send({ error: "Internal server error" });
        }
    }));
    /**
     * @openapi
     * /schedules/{scheduleId}:
     *   get:
     *     tags:
     *       - Schedules
     *     summary: Get a schedule by ID
     *     parameters:
     *       - in: path
     *         name: scheduleId
     *         required: true
     *         schema:
     *           type: integer
     *         description: The schedule ID
     *     responses:
     *       200:
     *         description: The schedule was found
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 id:
     *                   type: integer
     *             examples:
     *               example1:
     *                 summary: Example Schedule
     *                 value:
     *                   id: 1
     *       404:
     *         description: The schedule was not found
     *       500:
     *         description: Internal server error
     */
    app.get("/schedules/:scheduleId", authMiddleware_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const { scheduleId } = req.params;
        try {
            const scheduleUsecase = new schedule_usecase_1.ScheduleUsecase(database_1.AppDataSource);
            const schedule = yield scheduleUsecase.getScheduleById(Number(scheduleId));
            if (schedule) {
                res.status(200).send(schedule);
            }
            else {
                res.status(404).send({ error: "Schedule not found" });
            }
        }
        catch (error) {
            console.log(error);
            res.status(500).send({ error: "Internal server error" });
        }
    }));
    /**
     * @openapi
     * /schedules/{startDate}/{endDate}:
     *   get:
     *     tags:
     *       - Schedules
     *     parameters:
     *       - in: path
     *         name: startDate
     *         required: true
     *         schema:
     *           type: string
     *           format: date
     *       - in: path
     *         name: endDate
     *         required: true
     *         schema:
     *           type: string
     *           format: date
     *     responses:
     *       '200':
     *         description: OK
     *       '404':
     *         description: Schedule not found
     *       '500':
     *         description: Internal server error
     */
    app.get("/schedules/:startDate/:endDate", authMiddleware_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const { startDate, endDate } = req.params;
        try {
            const scheduleUsecase = new schedule_usecase_1.ScheduleUsecase(database_1.AppDataSource);
            const schedule = yield scheduleUsecase.getScheduleBetween(startDate, endDate);
            if (schedule) {
                res.status(200).send(schedule);
            }
            else {
                res.status(404).send({ error: "Schedule not found" });
            }
        }
        catch (error) {
            console.log(error);
            res.status(500).send({ error: "Internal server error" });
        }
    }));
    /**
     * @openapi
     * /schedules:
     *   post:
     *     tags:
     *       - Schedules
     *     summary: Create a new schedule
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               date:
     *                 type: string
     *                 format: date-time
     *                 description: The date and time of the schedule in ISO 8601 format
     *               movieId:
     *                 type: integer
     *                 description: The ID of the movie
     *               auditoriumId:
     *                 type: integer
     *                 description: The ID of the auditorium
     *     responses:
     *       201:
     *         description: The schedule was created
     *       400:
     *         description: The request was invalid
     *       500:
     *         description: Internal server error
     */
    app.post("/schedules", authMiddleware_1.authenticateToken, authMiddleware_1.authorizeAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const validation = schedule_validator_1.scheduleValidation.validate(req.body);
        if (validation.error) {
            res
                .status(400)
                .send((0, generate_validation_message_1.generateValidationErrorMessage)(validation.error.details));
            return;
        }
        const scheduleRequest = validation.value;
        scheduleRequest.date = new Date(scheduleRequest.date);
        const scheduleRepo = database_1.AppDataSource.getRepository(schedule_1.Schedule);
        const movieRepo = database_1.AppDataSource.getRepository(movie_1.Movie);
        const auditoriumRepo = database_1.AppDataSource.getRepository(auditorium_1.Auditorium);
        // Check if movie exists
        const movie = yield movieRepo.findOne({ where: { id: scheduleRequest.movieId } });
        if (!movie) {
            res.status(400).send({ error: "Movie does not exist" });
            return;
        }
        // Check if auditorium exists
        const auditorium = yield auditoriumRepo.findOne({ where: { id: scheduleRequest.auditoriumId } });
        if (!auditorium) {
            res.status(400).send({ error: "Auditorium does not exist" });
            return;
        }
        const scheduleUsecase = new schedule_usecase_1.ScheduleUsecase(database_1.AppDataSource);
        // Check if schedule date is not in the past
        if (!scheduleUsecase.isCorrectDate(scheduleRequest)) {
            res.status(400).send({ error: "Schedule date cannot be in the past" });
            return;
        }
        // Check if schedule is within opening hours and not on the weekend
        const scheduleDate = new Date(scheduleRequest.date);
        const dayOfWeek = scheduleDate.getDay();
        const hour = scheduleDate.getHours();
        if (dayOfWeek === 0 || dayOfWeek === 6 || hour < 9 || hour > 20) {
            res.status(400).send({ error: "Schedules can only be between 9am and 8pm from Monday to Friday" });
            return;
        }
        if (yield scheduleUsecase.doesOverlap(scheduleRequest)) {
            res.status(400).send({ error: "Overlapping schedules are not allowed" });
            return;
        }
        try {
            const scheduleCreated = yield scheduleRepo.save(scheduleRequest);
            res.status(201).send(scheduleCreated);
        }
        catch (error) {
            res.status(500).send({ error: "Internal error" });
        }
    }));
    /**
     * @openapi
     * /schedules/{id}:
     *   patch:
     *     tags:
     *       - Schedules
     *     summary: Update a schedule
     *     produces:
     *       - application/json
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: integer
     *         description: The ID of the schedule to update
     *       - in: body
     *         name: schedule
     *         description: Schedule object
     *         required: true
     *         schema:
     *           type: object
     *           properties:
     *             date:
     *               type: string
     *               format: date-time
     *               description: The date and time of the schedule in ISO 8601 format
     *             movieId:
     *               type: integer
     *               description: The ID of the movie
     *             auditoriumId:
     *               type: integer
     *               description: The ID of the auditorium
     *     responses:
     *       200:
     *         description: The schedule was updated
     *       404:
     *         description: The schedule was not found
     *       500:
     *         description: Internal server error
     */
    app.patch("/schedules/:id", authMiddleware_1.authenticateToken, authMiddleware_1.authorizeAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const validation = schedule_validator_1.updateScheduleValidation.validate(Object.assign(Object.assign({}, req.params), req.body));
        if (validation.error) {
            res
                .status(400)
                .send((0, generate_validation_message_1.generateValidationErrorMessage)(validation.error.details));
            return;
        }
        const updateScheduleReq = validation.value;
        try {
            const scheduleUsecase = new schedule_usecase_1.ScheduleUsecase(database_1.AppDataSource);
            const updatedSchedule = yield scheduleUsecase.updateSchedule(updateScheduleReq.id, Object.assign({}, updateScheduleReq));
            if (updatedSchedule === null) {
                res.status(404).send({
                    error: `schedule ${updateScheduleReq.id} not found`,
                });
                return;
            }
            res.status(200).send(updatedSchedule);
        }
        catch (error) {
            console.log(error);
            res.status(500).send({ error: "Internal error" });
        }
    }));
    /**
     * @openapi
     * /schedules/{id}:
     *   delete:
     *     tags:
     *       - Schedules
     *     summary: Delete a schedule
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: integer
     *         description: The schedule ID
     *     responses:
     *       200:
     *         description: The schedule was deleted
     *       404:
     *         description: The schedule was not found
     *       500:
     *         description: Internal server error
     */
    app.delete("/schedules/:id", authMiddleware_1.authenticateToken, authMiddleware_1.authorizeAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const validation = schedule_validator_1.deleteScheduleValidation.validate(req.params);
        if (validation.error) {
            res
                .status(400)
                .send((0, generate_validation_message_1.generateValidationErrorMessage)(validation.error.details));
            return;
        }
        try {
            const scheduleUsecase = new schedule_usecase_1.ScheduleUsecase(database_1.AppDataSource);
            const deletedSchedule = yield scheduleUsecase.deleteSchedule(Number(req.params.id));
            if (deletedSchedule) {
                res.status(200).send({
                    message: "Schedule removed successfully",
                    auditorium: deletedSchedule,
                });
            }
            else {
                res.status(404).send({ message: "Schedule not found" });
            }
        }
        catch (error) {
            res.status(500).send({ message: "Internal server error" });
        }
    }));
};
exports.initScheduleRoutes = initScheduleRoutes;
