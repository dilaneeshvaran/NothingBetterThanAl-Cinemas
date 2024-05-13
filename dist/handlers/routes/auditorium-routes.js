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
exports.initAuditoriumRoutes = void 0;
const moment_1 = __importDefault(require("moment"));
const authMiddleware_1 = require("../middlewares/authMiddleware");
const auditorium_validator_1 = require("../validators/auditorium-validator");
const generate_validation_message_1 = require("../validators/generate-validation-message");
const database_1 = require("../../database/database");
const auditorium_1 = require("../../database/entities/auditorium");
const auditorium_usecase_1 = require("../../domain/auditorium-usecase");
const initAuditoriumRoutes = (app) => {
    app.get("/health", (req, res) => {
        res.send({ message: "hello world" });
    });
    /**
     * @openapi
     * /auditoriums:
     *   get:
     *     tags:
     *       - Auditoriums
     *     description: Get a list of auditoriums
     *     responses:
     *       200:
     *         description: Successful operation
     *       400:
     *         description: Validation error
     *       500:
     *         description: Internal error
     */
    app.get("/auditoriums", authMiddleware_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const validation = auditorium_validator_1.listValidation.validate(req.query);
        if (validation.error) {
            res
                .status(400)
                .send((0, generate_validation_message_1.generateValidationErrorMessage)(validation.error.details));
            return;
        }
        const listAuditoriumReq = validation.value;
        let limit = 20;
        if (listAuditoriumReq.limit) {
            limit = listAuditoriumReq.limit;
        }
        const page = (_a = listAuditoriumReq.page) !== null && _a !== void 0 ? _a : 1;
        try {
            const auditoriumUsecase = new auditorium_usecase_1.AuditoriumUsecase(database_1.AppDataSource);
            const listAuditorium = yield auditoriumUsecase.listAuditorium(Object.assign(Object.assign({}, listAuditoriumReq), { page,
                limit }));
            res.status(200).send(listAuditorium);
        }
        catch (error) {
            console.log(error);
            res.status(500).send({ error: "Internal error" });
        }
    }));
    /**
     * @openapi
     * /auditoriums/{auditoriumId}:
     *   get:
     *     tags:
     *       - Auditoriums
     *     description: Get an auditorium by ID
     *     parameters:
     *       - name: auditoriumId
     *         in: path
     *         required: true
     *         description: ID of the auditorium
     *         schema:
     *           type: integer
     *     responses:
     *       200:
     *         description: Successful operation
     *       404:
     *         description: Auditorium not found
     *       500:
     *         description: Internal server error
     */
    app.get("/auditoriums/:auditoriumId", authMiddleware_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const { auditoriumId } = req.params;
        try {
            const auditoriumUsecase = new auditorium_usecase_1.AuditoriumUsecase(database_1.AppDataSource);
            const auditorium = yield auditoriumUsecase.getAuditoriumById(Number(auditoriumId));
            if (auditorium) {
                res.status(200).send(auditorium);
            }
            else {
                res.status(404).send({ error: "Auditorium not found" });
            }
        }
        catch (error) {
            console.log(error);
            res.status(500).send({ error: "Internal server error" });
        }
    }));
    /**
     * @openapi
     * /auditoriums:
     *   post:
     *     tags:
     *       - Auditoriums
     *     description: Create a new auditorium
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               name:
     *                 type: string
     *               description:
     *                 type: string
     *               imageUrl:
     *                 type: string
     *               type:
     *                 type: string
     *               capacity:
     *                 type: integer
     *               handicapAccessible:
     *                 type: boolean
     *               maintenance:
     *                 type: boolean
     *     responses:
     *       201:
     *         description: Auditorium created successfully
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Auditorium'
     *       400:
     *         description: Validation error
     *       500:
     *         description: Internal server error
     */
    app.post("/auditoriums", authMiddleware_1.authenticateToken, authMiddleware_1.authorizeAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const validation = auditorium_validator_1.auditoriumValidation.validate(req.body);
        if (validation.error) {
            res
                .status(400)
                .send((0, generate_validation_message_1.generateValidationErrorMessage)(validation.error.details));
            return;
        }
        const auditoriumRequest = validation.value;
        const auditoriumRepo = database_1.AppDataSource.getRepository(auditorium_1.Auditorium);
        try {
            const auditoriumCreated = yield auditoriumRepo.save(auditoriumRequest);
            res.status(201).send(auditoriumCreated);
        }
        catch (error) {
            res.status(500).send({ error: "Internal error" });
        }
    }));
    /**
     * @openapi
     * /auditoriums/{id}:
     *   patch:
     *     tags:
     *       - Auditoriums
     *     description: Update an existing auditorium
     *     parameters:
     *       - name: id
     *         in: path
     *         required: true
     *         description: ID of the auditorium to update
     *         schema:
     *           type: integer
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               name:
     *                 type: string
     *               description:
     *                 type: string
     *               imageUrl:
     *                 type: string
     *               type:
     *                 type: string
     *               capacity:
     *                 type: integer
     *               handicapAccessible:
     *                 type: boolean
     *               maintenance:
     *                 type: boolean
     *     responses:
     *       200:
     *         description: Auditorium updated successfully
     *       400:
     *         description: Validation error
     *       404:
     *         description: Auditorium not found
     *       500:
     *         description: Internal server error
     */
    app.patch("/auditoriums/:id", authMiddleware_1.authenticateToken, authMiddleware_1.authorizeAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const validation = auditorium_validator_1.updateAuditoriumValidation.validate(Object.assign(Object.assign({}, req.params), req.body));
        if (validation.error) {
            res
                .status(400)
                .send((0, generate_validation_message_1.generateValidationErrorMessage)(validation.error.details));
            return;
        }
        const updateAuditoriumReq = validation.value;
        try {
            const auditoriumUsecase = new auditorium_usecase_1.AuditoriumUsecase(database_1.AppDataSource);
            const updatedAuditorium = yield auditoriumUsecase.updateAuditorium(updateAuditoriumReq.id, Object.assign({}, updateAuditoriumReq));
            if (updatedAuditorium === null) {
                res.status(404).send({
                    error: `auditorium ${updateAuditoriumReq.id} not found`,
                });
                return;
            }
            res.status(200).send(updatedAuditorium);
        }
        catch (error) {
            console.log(error);
            res.status(500).send({ error: "Internal error" });
        }
    }));
    /**
     * @openapi
     * /auditoriums/{id}:
     *   delete:
     *     tags:
     *       - Auditoriums
     *     description: Delete an auditorium
     *     parameters:
     *       - name: id
     *         in: path
     *         required: true
     *         description: ID of the auditorium to delete
     *         schema:
     *           type: integer
     *     responses:
     *       200:
     *         description: Auditorium deleted successfully
     *       400:
     *         description: Validation error
     *       404:
     *         description: Auditorium not found
     *       500:
     *         description: Internal server error
     */
    app.delete("/auditoriums/:id", authMiddleware_1.authenticateToken, authMiddleware_1.authorizeAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const validation = auditorium_validator_1.deleteAuditoriumValidation.validate(req.params);
        if (validation.error) {
            res
                .status(400)
                .send((0, generate_validation_message_1.generateValidationErrorMessage)(validation.error.details));
            return;
        }
        try {
            const auditoriumUsecase = new auditorium_usecase_1.AuditoriumUsecase(database_1.AppDataSource);
            const deletedAuditorium = yield auditoriumUsecase.deleteAuditoriumCollection(Number(req.params.id));
            if (deletedAuditorium) {
                res.status(200).send({
                    message: "Auditorium removed successfully",
                    auditorium: deletedAuditorium,
                });
            }
            else {
                res.status(404).send({ message: "Auditorium not found" });
            }
        }
        catch (error) {
            console.error(error);
            res.status(500).send({ message: "Internal server error" });
        }
    }));
    /**
     * @openapi
     * /auditoriums/{auditoriumId}/schedules/{startDate}:
     *   get:
     *     tags:
     *       - Auditoriums
     *     description: Get the schedule for an auditorium
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - name: auditoriumId
     *         in: path
     *         required: true
     *         description: ID of the auditorium
     *         schema:
     *           type: integer
     *       - name: startDate
     *         in: path
     *         required: true
     *         description: Start date of the schedule
     *         schema:
     *           type: string
     *           format: date
     *     responses:
     *       200:
     *         description: Schedule retrieved successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 message:
     *                   type: string
     *                 scheduleIds:
     *                   type: array
     *                   items:
     *                     type: integer
     *       400:
     *         description: Validation error
     *       404:
     *         description: Schedule not found
     *       500:
     *         description: Internal server error
     */
    app.get("/auditoriums/:auditoriumId/schedules/:startDate", authMiddleware_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const validation = auditorium_validator_1.listAuditoriumScheduleValidation.validate(req.params);
        if (validation.error) {
            res
                .status(400)
                .send((0, generate_validation_message_1.generateValidationErrorMessage)(validation.error.details));
            return;
        }
        const listAuditoriumScheduleReq = validation.value;
        let auditoriumId;
        let startDate = new Date;
        if (listAuditoriumScheduleReq.auditoriumId) {
            auditoriumId = listAuditoriumScheduleReq.auditoriumId;
        }
        if (listAuditoriumScheduleReq.startDate) {
            startDate = (0, moment_1.default)(listAuditoriumScheduleReq.startDate, 'YYYY-MM-DD').toDate();
        }
        try {
            const auditoriumUsecase = new auditorium_usecase_1.AuditoriumUsecase(database_1.AppDataSource);
            const scheduleIds = yield auditoriumUsecase.getAuditoriumSchedule(Number(auditoriumId), startDate);
            if (scheduleIds.length > 0) {
                res.status(200).send({
                    message: "Schedule available : ",
                    scheduleIds: scheduleIds,
                });
            }
            else {
                res.status(404).send({ message: "schedule not available" });
            }
        }
        catch (error) {
            console.log(error);
            console.error('Error:', error.message);
            res.status(500).send({ error: "Internal server error" });
        }
    }));
};
exports.initAuditoriumRoutes = initAuditoriumRoutes;
