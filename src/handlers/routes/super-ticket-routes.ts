import express, { Request, Response } from "express";
import { authenticateToken, authorizeAdmin } from '../middlewares/authMiddleware';

import {
  superTicketValidation,
  updateSuperTicketValidation,
  deleteSuperTicketValidation,
  listSuperTicketValidation
} from "../validators/super-ticket-validator";
import { generateValidationErrorMessage } from "../validators/generate-validation-message";
import { AppDataSource } from "../../database/database";
import { SuperTicket } from "../../database/entities/super-ticket";
import { SuperTicketUsecase } from "../../domain/super-ticket-usecase";

export const initSuperTicketRoutes = (app: express.Express) => {
  app.get("/health", (req: Request, res: Response) => {
    res.send({ message: "hello world" });
  });

  app.get("/supertickets",authenticateToken, authorizeAdmin, async (req: Request, res: Response) => {
    const validation = listSuperTicketValidation.validate(req.query);
  
    if (validation.error) {
      res
        .status(400)
        .send(generateValidationErrorMessage(validation.error.details));
      return;
    }
  
    const listSuperTicketReq = validation.value;
    let limit = 20;
    if (listSuperTicketReq.limit) {
      limit = listSuperTicketReq.limit;
    }
    const page = listSuperTicketReq.page ?? 1;
  
    try {
      const superTicketUsecase = new SuperTicketUsecase(AppDataSource);
      const listSuperTicket = await superTicketUsecase.listSuperTickets({
        ...listSuperTicketReq,
        page,
        limit,
      });
      res.status(200).send(listSuperTicket);
    } catch (error) {
      console.log(error);
      res.status(500).send({ error: "Internal server error" });
    }
  });

  app.get("/supertickets/:superTicketId",authenticateToken, authorizeAdmin, async (req: Request, res: Response) => {
    const { superTicketId } = req.params;
  
    try {
      const superTicketUsecase = new SuperTicketUsecase(AppDataSource);
      const superTicket = await superTicketUsecase.getSuperTicketById(Number(superTicketId));
  
      if (superTicket) {
        res.status(200).send(superTicket);
      } else {
        res.status(404).send({ error: "SuperTicket not found" });
      }
    } catch (error) {
      console.log(error);
      res.status(500).send({ error: "Internal server error" });
    }
  });

  app.post("/supertickets", async (req: Request, res: Response) => {
    const validation = superTicketValidation.validate(req.body);
  
    if (validation.error) {
      res
        .status(400)
        .send(generateValidationErrorMessage(validation.error.details));
      return;
    }
  
    const superTicketRequest = validation.value;
    const superTicketRepo = AppDataSource.getRepository(SuperTicket);
    
    try {
      const superTicketCreated = await superTicketRepo.save(superTicketRequest);
      res.status(201).send(superTicketCreated);
    } catch (error) {
      res.status(500).send({ error: "Internal error" });
    }
  });

  app.patch("/supertickets/:id",authenticateToken, authorizeAdmin, async (req: Request, res: Response) => {
    const validation = updateSuperTicketValidation.validate({
      ...req.params,
      ...req.body,
    });

    if (validation.error) {
      res
        .status(400)
        .send(generateValidationErrorMessage(validation.error.details));
      return;
    }

    const updateSuperTicketReq = validation.value;

    try {
      const superTicketUsecase = new SuperTicketUsecase(AppDataSource);
      const updatedSuperTicket = await superTicketUsecase.updateSuperTicket(updateSuperTicketReq.id, {
        ...updateSuperTicketReq,
      });
      if (updatedSuperTicket === null) {
        res.status(404).send({
          error: `SuperTicket ${updateSuperTicketReq.id} not found`,
        });
        return;
      }
      res.status(200).send(updatedSuperTicket);
    } catch (error) {
      console.log(error);
      res.status(500).send({ error: "Internal error" });
    }
  });

  app.patch("/supertickets/:id/bookSchedule", async (req: Request, res: Response) => {
    
    const validation = updateSuperTicketValidation.validate(req.params);

    if (validation.error) {
      res
        .status(400)
        .send(generateValidationErrorMessage(validation.error.details));
      return;
    }

    const updateSuperTicketReq = validation.value;
    const scheduleId = req.body.scheduleId; 
    try {
      const superTicketUsecase = new SuperTicketUsecase(AppDataSource);
      const updatedSuperTicket = await superTicketUsecase.bookSchedule(updateSuperTicketReq.id, scheduleId);

      res.status(200).send(updatedSuperTicket);
    } catch (error) {
      console.log(error);
      res.status(500).send({ error: "Internal error" });
    }
});

app.get("/supertickets/:id/validate", async (req: Request, res: Response) => {
  const superTicketId = Number(req.params.id);
  const superTicketUsecase = new SuperTicketUsecase(AppDataSource);
  const isValid = await superTicketUsecase.validateSuperTicket(superTicketId);

  res.status(200).send({ isValid });
});

  app.delete("/supertickets/:id",authenticateToken, authorizeAdmin, async (req: Request, res: Response) => {
    const validation = deleteSuperTicketValidation.validate(req.params);

    if (validation.error) {
      res
        .status(400)
        .send(generateValidationErrorMessage(validation.error.details));
      return;
    }

    try {
      
      const superTicketUsecase = new SuperTicketUsecase(AppDataSource);

      const deletedSuperTicket = await superTicketUsecase.deleteSuperTicket(Number(req.params.id));

      if (deletedSuperTicket) {
        res.status(200).send({
          message: "SuperTicket removed successfully",
          superTicket: deletedSuperTicket,
        });
      } else {
        res.status(404).send({ message: "SuperTicket not found" });
      }
    } catch (error) {
      res.status(500).send({ message: "Internal server error" });
    }
  });

};