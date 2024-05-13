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
exports.initSuperTicketRoutes = void 0;
const authMiddleware_1 = require("../middlewares/authMiddleware");
const super_ticket_validator_1 = require("../validators/super-ticket-validator");
const generate_validation_message_1 = require("../validators/generate-validation-message");
const database_1 = require("../../database/database");
const super_ticket_1 = require("../../database/entities/super-ticket");
const super_ticket_usecase_1 = require("../../domain/super-ticket-usecase");
const transaction_usecase_1 = require("../../domain/transaction-usecase");
const initSuperTicketRoutes = (app) => {
    app.get("/health", (req, res) => {
        res.send({ message: "hello world" });
    });
    /**
     * @openapi
     * /supertickets:
     *   get:
     *     tags:
     *       - SuperTickets
     *     description: Returns all SuperTickets
     *     responses:
     *       200:
     *         description: An array of SuperTickets
     */
    app.get("/supertickets", authMiddleware_1.authenticateToken, authMiddleware_1.authorizeAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const validation = super_ticket_validator_1.listSuperTicketValidation.validate(req.query);
        if (validation.error) {
            res
                .status(400)
                .send((0, generate_validation_message_1.generateValidationErrorMessage)(validation.error.details));
            return;
        }
        const listSuperTicketReq = validation.value;
        let limit = 20;
        if (listSuperTicketReq.limit) {
            limit = listSuperTicketReq.limit;
        }
        const page = (_a = listSuperTicketReq.page) !== null && _a !== void 0 ? _a : 1;
        try {
            const superTicketUsecase = new super_ticket_usecase_1.SuperTicketUsecase(database_1.AppDataSource);
            const listSuperTicket = yield superTicketUsecase.listSuperTickets(Object.assign(Object.assign({}, listSuperTicketReq), { page,
                limit }));
            res.status(200).send(listSuperTicket);
        }
        catch (error) {
            console.log(error);
            res.status(500).send({ error: "Internal server error" });
        }
    }));
    /**
     * @openapi
     * /supertickets/{superTicketId}:
     *   get:
     *     tags:
     *       - SuperTickets
     *     description: Returns a specific SuperTicket
     *     parameters:
     *       - name: superTicketId
     *         in: path
     *         required: true
     *         type: integer
     *     responses:
     *       200:
     *         description: A SuperTicket object
     */
    app.get("/supertickets/:superTicketId", authMiddleware_1.authenticateToken, authMiddleware_1.authorizeAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const { superTicketId } = req.params;
        try {
            const superTicketUsecase = new super_ticket_usecase_1.SuperTicketUsecase(database_1.AppDataSource);
            const superTicket = yield superTicketUsecase.getSuperTicketById(Number(superTicketId));
            if (superTicket) {
                res.status(200).send(superTicket);
            }
            else {
                res.status(404).send({ error: "SuperTicket not found" });
            }
        }
        catch (error) {
            console.log(error);
            res.status(500).send({ error: "Internal server error" });
        }
    }));
    /**
     * @openapi
     * /supertickets:
     *   post:
     *     tags:
     *       - SuperTickets
     *     description: Creates a new SuperTicket
     *     produces:
     *       - application/json
     *     responses:
     *       201:
     *         description: Successfully created a SuperTicket
     */
    app.post("/supertickets", authMiddleware_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const validation = super_ticket_validator_1.superTicketValidation.validate(req.body);
        if (validation.error) {
            res
                .status(400)
                .send((0, generate_validation_message_1.generateValidationErrorMessage)(validation.error.details));
            return;
        }
        const superTicketRequest = validation.value;
        if (!req.user) {
            res.status(401).send({ error: "Unauthorized" });
            return;
        }
        superTicketRequest.userId = req.user.id;
        const transactionUsecase = new transaction_usecase_1.TransactionUsecase(database_1.AppDataSource);
        const balance = yield transactionUsecase.getBalance(req.user.id);
        if (balance === null) {
            res.status(404).send({ error: "User not found" });
            return;
        }
        if (balance < 100) {
            res.status(400).send({ error: "Insufficient balance" });
            return;
        }
        superTicketRequest.userId = req.user.id;
        const superTicketRepo = database_1.AppDataSource.getRepository(super_ticket_1.SuperTicket);
        try {
            const superTicketCreated = yield superTicketRepo.save(superTicketRequest);
            res.status(201).send(superTicketCreated);
        }
        catch (error) {
            res.status(500).send({ error: "Internal error" });
        }
    }));
    /**
     * @openapi
     * /supertickets/{id}:
     *   patch:
     *     tags:
     *       - SuperTickets
     *     description: Updates a specific SuperTicket
     *     parameters:
     *       - name: id
     *         in: path
     *         required: true
     *         schema:
     *           type: string
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               usesRemaining:
     *                 type: integer
     *                 description: The remaining uses of the SuperTicket
     *               usedSchedules:
     *                 type: array
     *                 items:
     *                   type: integer
     *                 description: The schedules used by the SuperTicket
     *             required:
     *               - usesRemaining
     *     responses:
     *       200:
     *         description: Successfully updated the SuperTicket
     *       400:
     *         description: Validation error
     *       404:
     *         description: SuperTicket not found
     *       500:
     *         description: Internal error
     */
    app.patch("/supertickets/:id", authMiddleware_1.authenticateToken, authMiddleware_1.authorizeAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const validation = super_ticket_validator_1.updateSuperTicketValidation.validate(Object.assign(Object.assign({}, req.params), req.body));
        if (validation.error) {
            res
                .status(400)
                .send((0, generate_validation_message_1.generateValidationErrorMessage)(validation.error.details));
            return;
        }
        const updateSuperTicketReq = validation.value;
        try {
            const superTicketUsecase = new super_ticket_usecase_1.SuperTicketUsecase(database_1.AppDataSource);
            const updatedSuperTicket = yield superTicketUsecase.updateSuperTicket(updateSuperTicketReq.id, Object.assign({}, updateSuperTicketReq));
            if (updatedSuperTicket === null) {
                res.status(404).send({
                    error: `SuperTicket ${updateSuperTicketReq.id} not found`,
                });
                return;
            }
            res.status(200).send(updatedSuperTicket);
        }
        catch (error) {
            console.log(error);
            res.status(500).send({ error: "Internal error" });
        }
    }));
    /**
     * @openapi
     * /supertickets/{id}/bookSchedule:
     *   patch:
     *     tags:
     *       - SuperTickets
     *     summary: Books a schedule for a specific SuperTicket
     *     description: Updates a SuperTicket with the specified schedule.
     *     parameters:
     *       - name: id
     *         in: path
     *         description: The ID of the SuperTicket to update.
     *         required: true
     *         schema:
     *           type: integer
     *       - name: body
     *         in: body
     *         required: true
     *         description: Request body for updating the SuperTicket schedule.
     *         schema:
     *           type: object
     *           properties:
     *             scheduleId:
     *               type: integer
     *               description: The ID of the schedule to book.
     *     responses:
     *       200:
     *         description: Successfully booked the schedule for the SuperTicket.
     *       400:
     *         description: Bad request. Indicates an issue with the request parameters or body.
     *       500:
     *         description: Internal server error. Indicates a server-side issue occurred.
     */
    app.patch("/supertickets/:id/bookSchedule", authMiddleware_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const validation = super_ticket_validator_1.bookSuperTicketValidation.validate(Object.assign(Object.assign({}, req.params), req.body));
        if (validation.error) {
            res
                .status(400)
                .send((0, generate_validation_message_1.generateValidationErrorMessage)(validation.error.details));
            return;
        }
        const updateSuperTicketReq = validation.value;
        const scheduleId = req.body.scheduleId;
        try {
            const superTicketUsecase = new super_ticket_usecase_1.SuperTicketUsecase(database_1.AppDataSource);
            const updatedSuperTicket = yield superTicketUsecase.bookSchedule(updateSuperTicketReq.id, scheduleId);
            res.status(200).send(updatedSuperTicket);
        }
        catch (error) {
            console.log(error);
            res.status(500).send({ error: "Internal error" });
        }
    }));
    /**
     * @openapi
     * /supertickets/{id}/validate:
     *   get:
     *     tags:
     *       - SuperTickets
     *     description: Validates a specific SuperTicket
     *     parameters:
     *       - name: superticket id
     *         in: path
     *         required: true
     *         type: integer
     *     responses:
     *       200:
     *         description: Validation result of the SuperTicket
     */
    app.get("/supertickets/:id/validate", authMiddleware_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const superTicketId = Number(req.params.id);
        const superTicketUsecase = new super_ticket_usecase_1.SuperTicketUsecase(database_1.AppDataSource);
        const isValid = yield superTicketUsecase.validateSuperTicket(superTicketId);
        if (isValid === null) {
            res.status(404).send({ error: 'Super ticket not found' });
        }
        else {
            res.status(200).send({ isValid });
        }
    }));
    /**
     * @openapi
     * /supertickets/{id}:
     *   delete:
     *     tags:
     *       - SuperTickets
     *     description: Deletes a specific SuperTicket
     *     parameters:
     *       - name: id
     *         in: path
     *         required: true
     *         type: integer
     *     responses:
     *       200:
     *         description: Successfully deleted the SuperTicket
     */
    app.delete("/supertickets/:id", authMiddleware_1.authenticateToken, authMiddleware_1.authorizeAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const validation = super_ticket_validator_1.deleteSuperTicketValidation.validate(req.params);
        if (validation.error) {
            res
                .status(400)
                .send((0, generate_validation_message_1.generateValidationErrorMessage)(validation.error.details));
            return;
        }
        try {
            const superTicketUsecase = new super_ticket_usecase_1.SuperTicketUsecase(database_1.AppDataSource);
            const deletedSuperTicket = yield superTicketUsecase.deleteSuperTicket(Number(req.params.id));
            if (deletedSuperTicket) {
                res.status(200).send({
                    message: "SuperTicket removed successfully",
                    superTicket: deletedSuperTicket,
                });
            }
            else {
                res.status(404).send({ message: "SuperTicket not found" });
            }
        }
        catch (error) {
            res.status(500).send({ message: "Internal server error" });
        }
    }));
};
exports.initSuperTicketRoutes = initSuperTicketRoutes;
