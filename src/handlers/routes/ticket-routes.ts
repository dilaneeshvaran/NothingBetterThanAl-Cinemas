import express, { Request, Response } from "express";
import { authenticateToken, authorizeAdmin } from '../middlewares/authMiddleware';

import {listValidation
} from "../validators/schedule-validator";
import {ticketValidation,updateTicketValidation,deleteTicketValidation} from "../validators/ticket-validator"
import { generateValidationErrorMessage } from "../validators/generate-validation-message";
import { AppDataSource } from "../../database/database";
import { TicketUsecase } from "../../domain/ticket-usecase";
import { TransactionUsecase } from "../../domain/transaction-usecase";
import { RequestWithUser } from "../../types/request-with-user";
import { TransactionType } from "../../database/entities/transaction";


export const initTicketRoutes = (app: express.Express) => {
  app.get("/health", (req: Request, res: Response) => {
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
  app.get("/tickets",authenticateToken, authorizeAdmin, async (req: Request, res: Response) => {
    const validation = listValidation.validate(req.query);
  
    if (validation.error) {
      res
        .status(400)
        .send(generateValidationErrorMessage(validation.error.details));
      return;
    }
  
    const lisTicketReq = validation.value;
    let limit = 20;
    if (lisTicketReq.limit) {
      limit = lisTicketReq.limit;
    }
    const page = lisTicketReq.page ?? 1;
  
    try {
      const ticketUsecase = new TicketUsecase(AppDataSource);
      const listTicket = await ticketUsecase.listTicket({
        ...lisTicketReq,
        page,
        limit,
      });
      res.status(200).send(listTicket);
    } catch (error) {
      console.log(error);
      res.status(500).send({ error: "Internal server error" });
    }
  });
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
  app.get("/tickets/:ticketId",authenticateToken, authorizeAdmin, async (req: Request, res: Response) => {
    const { ticketId } = req.params;
  
    try {
      const ticketUsecase = new TicketUsecase(AppDataSource);
      const ticket = await ticketUsecase.getTicketById(Number(ticketId));
  
      if (ticket) {
        res.status(200).send(ticket);
      } else {
        res.status(404).send({ error: "Ticket not found" });
      }
    } catch (error) {
      console.log(error);
      res.status(500).send({ error: "Internal server error" });
    }
  });

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
  app.post("/tickets", authenticateToken, async (req: RequestWithUser, res: Response) => {
    const validation = ticketValidation.validate(req.body);

    if (validation.error) {
      res
        .status(400)
        .send(generateValidationErrorMessage(validation.error.details));
      return;
    }
  
    try {
      const ticketUsecase = new TicketUsecase(AppDataSource);
      const transactionUsecase = new TransactionUsecase(AppDataSource);
      const ticketRequest = req.body;
  
      if (!req.user) {
          res.status(401).send({ error: "Unauthorized" });
          return;
      }
  
      const schedule = await ticketUsecase.checkScheduleExists(ticketRequest.scheduleId);
      await ticketUsecase.checkAuditoriumCapacity(schedule);
      const user = await ticketUsecase.fetchUserAndCheckBalance(req.user.id, ticketRequest.price);
      await ticketUsecase.updateUserBalance(user, ticketRequest.price);
      ticketRequest.userId = user.id;
      const ticketCreated = await ticketUsecase.saveTicket(ticketRequest);
      const transaction = await transactionUsecase.recordTransaction(req.user.id, TransactionType.PURCHASE, ticketRequest.price);
      res.status(201).send({ ticket: ticketCreated, transaction });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Internal error" });
  }
});

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
  app.patch("/tickets/:id",authenticateToken, authorizeAdmin, async (req: Request, res: Response) => {
    const validation = updateTicketValidation.validate({
      ...req.params,
      ...req.body,
    });

    if (validation.error) {
      res
        .status(400)
        .send(generateValidationErrorMessage(validation.error.details));
      return;
    }

    const updateTicketReq = validation.value;

    try {
      const ticketUsecase = new TicketUsecase(AppDataSource);
      const updatedTicket = await ticketUsecase.updateTicket(updateTicketReq.id, {
        ...updateTicketReq,
      });
      if (updatedTicket === null) {
        res.status(404).send({
          error: `ticket ${updateTicketReq.id} not found`,
        });
        return;
      }
      res.status(200).send(updatedTicket);
    } catch (error) {
      console.log(error);
      res.status(500).send({ error: "Internal error" });
    }
  });

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
  app.get("/tickets/:id/validate", authenticateToken, async (req: Request, res: Response) => {
    const ticketId = Number(req.params.id);
if (isNaN(ticketId)) {
    res.status(400).send({ error: 'Invalid ticket ID' });
    return;
}
    const ticketUsecase = new TicketUsecase(AppDataSource);
    const ticket = await ticketUsecase.getTicketById(ticketId);

    if (!ticket) {
        res.status(404).send({ isValidated: false });
        return;
    }

    if (ticket.used) {
        res.status(400).send({ isValidated: false });
        return;
    }

    const isValid = await ticketUsecase.validateTicket(ticketId);
    if (!isValid) {
        res.status(400).send({ isValidated: false });
        return;
    }

    res.status(200).send({ isValidated: true });
});

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
  app.delete("/tickets/:id",authenticateToken, authorizeAdmin, async (req: Request, res: Response) => {
    const validation = deleteTicketValidation.validate(req.params);

    if (validation.error) {
      res
        .status(400)
        .send(generateValidationErrorMessage(validation.error.details));
      return;
    }

    try {
      
      const ticketUsecase = new TicketUsecase(AppDataSource);

      const deletedTicket = await ticketUsecase.deleteTicket(Number(req.params.id));

      if (deletedTicket) {
        res.status(200).send({
          message: "Ticket removed successfully",
          ticket: deletedTicket,
        });
      } else {
        res.status(404).send({ message: "Ticket not found" });
      }
    } catch (error) {
      res.status(500).send({ message: "Internal server error" });
    }
  });

};

