import express, { Request, Response } from "express";
import moment from 'moment';

import {
  scheduleValidation,
updateScheduleValidation,
deleteScheduleValidation,listValidation
} from "../validators/schedule-validator";
import {ticketValidation,updateTicketValidation,deleteTicketValidation} from "../validators/ticket-validator"
import { generateValidationErrorMessage } from "../validators/generate-validation-message";
import { AppDataSource } from "../../database/database";
import { Ticket } from "../../database/entities/ticket";
import { TicketUsecase } from "../../domain/ticket-usecase";

export const initTicketRoutes = (app: express.Express) => {
  app.get("/health", (req: Request, res: Response) => {
    res.send({ message: "hello world" });
  });

  app.get("/tickets", async (req: Request, res: Response) => {
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

  app.get("/tickets/:ticketId", async (req: Request, res: Response) => {
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

  app.post("/tickets", async (req: Request, res: Response) => {
    const validation = ticketValidation.validate(req.body);
  
    if (validation.error) {
      res
        .status(400)
        .send(generateValidationErrorMessage(validation.error.details));
      return;
    }
  
    const ticketRequest = validation.value;
    const ticketRepo = AppDataSource.getRepository(Ticket);
    
    try {
      const ticketCreated = await ticketRepo.save(ticketRequest);
      res.status(201).send(ticketCreated);
    } catch (error) {
      res.status(500).send({ error: "Internal error" });
    }
  });

  app.patch("/tickets/:id", async (req: Request, res: Response) => {
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

  app.get("/tickets/:id/validate", async (req: Request, res: Response) => {
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

  app.delete("/tickets/:id", async (req: Request, res: Response) => {
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

