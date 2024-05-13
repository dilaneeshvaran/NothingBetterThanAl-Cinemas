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
exports.initTicketRoutes = void 0;
const authMiddleware_1 = require("../middlewares/authMiddleware");
const schedule_validator_1 = require("../validators/schedule-validator");
const ticket_validator_1 = require("../validators/ticket-validator");
const generate_validation_message_1 = require("../validators/generate-validation-message");
const database_1 = require("../../database/database");
const ticket_usecase_1 = require("../../domain/ticket-usecase");
const transaction_usecase_1 = require("../../domain/transaction-usecase");
const transaction_1 = require("../../database/entities/transaction");
const initTicketRoutes = (app) => {
    app.get("/health", (req, res) => {
        res.send({ message: "hello world" });
    });
    /**
     * @openapi
     * /tickets:
     *   get:
     *     tags:
     *       - Tickets
     *     summary: Get tickets
     *     description: Retrieve tickets from the server
     *     responses:
     *       200:
     *         description: Successful response
     */
    app.get("/tickets", authMiddleware_1.authenticateToken, authMiddleware_1.authorizeAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const validation = schedule_validator_1.listValidation.validate(req.query);
        if (validation.error) {
            res
                .status(400)
                .send((0, generate_validation_message_1.generateValidationErrorMessage)(validation.error.details));
            return;
        }
        const lisTicketReq = validation.value;
        let limit = 20;
        if (lisTicketReq.limit) {
            limit = lisTicketReq.limit;
        }
        const page = (_a = lisTicketReq.page) !== null && _a !== void 0 ? _a : 1;
        try {
            const ticketUsecase = new ticket_usecase_1.TicketUsecase(database_1.AppDataSource);
            const listTicket = yield ticketUsecase.listTicket(Object.assign(Object.assign({}, lisTicketReq), { page,
                limit }));
            res.status(200).send(listTicket);
        }
        catch (error) {
            console.log(error);
            res.status(500).send({ error: "Internal server error" });
        }
    }));
    /**
     * @openapi
     * /tickets/{ticketId}:
     *   get:
     *     tags:
     *       - Tickets
     *     summary: Get ticket by ID
     *     description: Retrieve a specific ticket by its ID
     *     parameters:
     *       - in: path
     *         name: ticketId
     *         required: true
     *         schema:
     *           type: integer
     *     responses:
     *       200:
     *         description: Successful response
     */
    app.get("/tickets/:ticketId", authMiddleware_1.authenticateToken, authMiddleware_1.authorizeAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const { ticketId } = req.params;
        try {
            const ticketUsecase = new ticket_usecase_1.TicketUsecase(database_1.AppDataSource);
            const ticket = yield ticketUsecase.getTicketById(Number(ticketId));
            if (ticket) {
                res.status(200).send(ticket);
            }
            else {
                res.status(404).send({ error: "Ticket not found" });
            }
        }
        catch (error) {
            console.log(error);
            res.status(500).send({ error: "Internal server error" });
        }
    }));
    /**
     * @openapi
     * /tickets:
     *   post:
     *     tags:
     *       - Tickets
     *     summary: Create a ticket
     *     description: Create a new ticket
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               scheduleId:
     *                 type: integer
     *                 description: The ID of the schedule for the ticket
     *               price:
     *                 type: number
     *                 description: The price of the ticket
     *     responses:
     *       201:
     *         description: Successful response, returns the created ticket and transaction
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 ticket:
     *                   type: object
     *                   properties:
     *                     id:
     *                       type: integer
     *                     scheduleId:
     *                       type: integer
     *                     price:
     *                       type: number
     *                     userId:
     *                       type: integer
     *                 transaction:
     *                   type: object
     *                   properties:
     *                     id:
     *                       type: integer
     *                     userId:
     *                       type: integer
     *                     type:
     *                       type: string
     *                     amount:
     *                       type: number
     *       400:
     *         description: Bad request, validation error
     *       401:
     *         description: Unauthorized, user not authenticated
     *       500:
     *         description: Internal server error
     */
    app.post("/tickets", authMiddleware_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const validation = ticket_validator_1.ticketValidation.validate(req.body);
        if (validation.error) {
            res
                .status(400)
                .send((0, generate_validation_message_1.generateValidationErrorMessage)(validation.error.details));
            return;
        }
        try {
            const ticketUsecase = new ticket_usecase_1.TicketUsecase(database_1.AppDataSource);
            const transactionUsecase = new transaction_usecase_1.TransactionUsecase(database_1.AppDataSource);
            const ticketRequest = req.body;
            if (!req.user) {
                res.status(401).send({ error: "Unauthorized" });
                return;
            }
            const schedule = yield ticketUsecase.checkScheduleExists(ticketRequest.scheduleId);
            yield ticketUsecase.checkAuditoriumCapacity(schedule);
            const user = yield ticketUsecase.fetchUserAndCheckBalance(req.user.id, ticketRequest.price);
            yield ticketUsecase.updateUserBalance(user, ticketRequest.price);
            ticketRequest.userId = user.id;
            const ticketCreated = yield ticketUsecase.saveTicket(ticketRequest);
            const transaction = yield transactionUsecase.recordTransaction(req.user.id, transaction_1.TransactionType.PURCHASE, ticketRequest.price);
            res.status(201).send({ ticket: ticketCreated, transaction });
        }
        catch (error) {
            console.error(error);
            res.status(500).send({ error: "Internal error" });
        }
    }));
    /**
     * @openapi
     * /tickets/{id}:
     *   patch:
     *     tags:
     *       - Tickets
     *     summary: Update a ticket
     *     description: Update a specific ticket by its ID
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: integer
     *     requestBody:
     *       required: false
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               scheduleId:
     *                 type: integer
     *                 description: The ID of the schedule for the ticket
     *               used:
     *                 type: boolean
     *                 description: The usage status of the ticket
     *     responses:
     *       200:
     *         description: Successful response
     */
    app.patch("/tickets/:id", authMiddleware_1.authenticateToken, authMiddleware_1.authorizeAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const validation = ticket_validator_1.updateTicketValidation.validate(Object.assign(Object.assign({}, req.params), req.body));
        if (validation.error) {
            res
                .status(400)
                .send((0, generate_validation_message_1.generateValidationErrorMessage)(validation.error.details));
            return;
        }
        const updateTicketReq = validation.value;
        try {
            const ticketUsecase = new ticket_usecase_1.TicketUsecase(database_1.AppDataSource);
            const updatedTicket = yield ticketUsecase.updateTicket(updateTicketReq.id, Object.assign({}, updateTicketReq));
            if (updatedTicket === null) {
                res.status(404).send({
                    error: `ticket ${updateTicketReq.id} not found`,
                });
                return;
            }
            res.status(200).send(updatedTicket);
        }
        catch (error) {
            console.log(error);
            res.status(500).send({ error: "Internal error" });
        }
    }));
    /**
     * @openapi
     * /tickets/{id}/validate:
     *   get:
     *     tags:
     *       - Tickets
     *     summary: Validate a ticket
     *     description: Validate a ticket by its ID
     *     parameters:
     *       - in: path
     *         name: id
     *         schema:
     *           type: integer
     *         required: true
     *         description: Numeric ID of the ticket to validate
     *     responses:
     *       200:
     *         description: Successful validation, returns true
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 isValidated:
     *                   type: boolean
     *       400:
     *         description: Bad request, ticket already used or validation failed
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 isValidated:
     *                   type: boolean
     *       404:
     *         description: Not found, ticket not found
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 isValidated:
     *                   type: boolean
     */
    app.get("/tickets/:id/validate", authMiddleware_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const ticketId = Number(req.params.id);
        if (isNaN(ticketId)) {
            res.status(400).send({ error: 'Invalid ticket ID' });
            return;
        }
        const ticketUsecase = new ticket_usecase_1.TicketUsecase(database_1.AppDataSource);
        const ticket = yield ticketUsecase.getTicketById(ticketId);
        if (!ticket) {
            res.status(404).send({ isValidated: false });
            return;
        }
        if (ticket.used) {
            res.status(400).send({ isValidated: false });
            return;
        }
        const isValid = yield ticketUsecase.validateTicket(ticketId);
        if (!isValid) {
            res.status(400).send({ isValidated: false });
            return;
        }
        res.status(200).send({ isValidated: true });
    }));
    /**
     * @openapi
     * /tickets/{id}:
     *   delete:
     *     tags:
     *       - Tickets
     *     summary: Delete a ticket
     *     description: Delete a specific ticket by its ID
     *     parameters:
     *       - in: path
     *         name: ticketId
     *         required: true
     *         schema:
     *           type: integer
     *     responses:
     *       200:
     *         description: Successful response
     */
    app.delete("/tickets/:id", authMiddleware_1.authenticateToken, authMiddleware_1.authorizeAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const validation = ticket_validator_1.deleteTicketValidation.validate(req.params);
        if (validation.error) {
            res
                .status(400)
                .send((0, generate_validation_message_1.generateValidationErrorMessage)(validation.error.details));
            return;
        }
        try {
            const ticketUsecase = new ticket_usecase_1.TicketUsecase(database_1.AppDataSource);
            const deletedTicket = yield ticketUsecase.deleteTicket(Number(req.params.id));
            if (deletedTicket) {
                res.status(200).send({
                    message: "Ticket removed successfully",
                    ticket: deletedTicket,
                });
            }
            else {
                res.status(404).send({ message: "Ticket not found" });
            }
        }
        catch (error) {
            res.status(500).send({ message: "Internal server error" });
        }
    }));
};
exports.initTicketRoutes = initTicketRoutes;
