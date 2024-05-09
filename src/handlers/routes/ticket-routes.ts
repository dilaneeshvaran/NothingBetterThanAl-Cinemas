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

  app.get("/tickets/:id/validate", authenticateToken, async (req: Request, res: Response) => {
    const ticketId = Number(req.params.id);
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

