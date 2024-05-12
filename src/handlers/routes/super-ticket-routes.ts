import express, { Request, Response } from "express";
import { authenticateToken, authorizeAdmin } from '../middlewares/authMiddleware';

import {
  superTicketValidation,
  updateSuperTicketValidation,
  deleteSuperTicketValidation,
  listSuperTicketValidation,bookSuperTicketValidation
} from "../validators/super-ticket-validator";
import { generateValidationErrorMessage } from "../validators/generate-validation-message";
import { AppDataSource } from "../../database/database";
import { SuperTicket } from "../../database/entities/super-ticket";
import { SuperTicketUsecase } from "../../domain/super-ticket-usecase";

import { RequestWithUser } from "../../types/request-with-user";
import { User } from "../../database/entities/user";
import { TransactionUsecase } from "../../domain/transaction-usecase";

export const initSuperTicketRoutes = (app: express.Express) => {
  app.get("/health", (req: Request, res: Response) => {
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
app.post("/supertickets", authenticateToken, async (req: RequestWithUser, res: Response) => {
  const validation = superTicketValidation.validate(req.body);

  if (validation.error) {
    res
      .status(400)
      .send(generateValidationErrorMessage(validation.error.details));
    return;
  }

  const superTicketRequest = validation.value;
  if (!req.user) {
    res.status(401).send({ error: "Unauthorized" });
    return;
  }

  superTicketRequest.userId = req.user.id;

const transactionUsecase = new TransactionUsecase(AppDataSource);
const balance = await transactionUsecase.getBalance(req.user.id);
if (balance === null) {
  res.status(404).send({ error: "User not found" });
  return;
}
if (balance < 100) {
  res.status(400).send({ error: "Insufficient balance" });
  return;
}


  superTicketRequest.userId = req.user.id;
  const superTicketRepo = AppDataSource.getRepository(SuperTicket);
  
  try {
    const superTicketCreated = await superTicketRepo.save(superTicketRequest);
    res.status(201).send(superTicketCreated);
  } catch (error) {
    res.status(500).send({ error: "Internal error" });
  }
});

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
  app.patch("/supertickets/:id/bookSchedule", authenticateToken, async (req: Request, res: Response) => {
    
    const validation = bookSuperTicketValidation.validate({ ...req.params, ...req.body });

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
app.get("/supertickets/:id/validate", authenticateToken, async (req: Request, res: Response) => {
  const superTicketId = Number(req.params.id);
  const superTicketUsecase = new SuperTicketUsecase(AppDataSource);
  const isValid = await superTicketUsecase.validateSuperTicket(superTicketId);

  if (isValid === null) {
    res.status(404).send({ error: 'Super ticket not found' });
  } else {
    res.status(200).send({ isValid });
  }
});

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