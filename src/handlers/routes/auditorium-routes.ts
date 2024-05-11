import express, { Request, Response } from "express";
import moment from 'moment';
import { authenticateToken, authorizeAdmin } from '../middlewares/authMiddleware';

import {
    auditoriumValidation,
    listValidation,
  deleteAuditoriumValidation,
  updateAuditoriumValidation,
  listAuditoriumScheduleValidation,
} from "../validators/auditorium-validator";

import { generateValidationErrorMessage } from "../validators/generate-validation-message";
import { AppDataSource } from "../../database/database";
import { Auditorium } from "../../database/entities/auditorium";
import { AuditoriumUsecase } from "../../domain/auditorium-usecase";

export const initAuditoriumRoutes = (app: express.Express) => {
  app.get("/health", (req: Request, res: Response) => {
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
  app.get("/auditoriums", authenticateToken, async (req: Request, res: Response) => {
    const validation = listValidation.validate(req.query);

    if (validation.error) {
      res
        .status(400)
        .send(generateValidationErrorMessage(validation.error.details));
      return;
    }

    const listAuditoriumReq = validation.value;
    let limit = 20;
    if (listAuditoriumReq.limit) {
      limit = listAuditoriumReq.limit;
    }
    const page = listAuditoriumReq.page ?? 1;

    try {
      const auditoriumUsecase = new AuditoriumUsecase(AppDataSource);
      const listAuditorium = await auditoriumUsecase.listAuditorium({
        ...listAuditoriumReq,
        page,
        limit,
      });
      res.status(200).send(listAuditorium);
    } catch (error) {
      console.log(error);
      res.status(500).send({ error: "Internal error" });
    }
  });

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
  app.get("/auditoriums/:auditoriumId",authenticateToken,  async (req: Request, res: Response) => {
    const { auditoriumId } = req.params;
  
    try {
      const auditoriumUsecase = new AuditoriumUsecase(AppDataSource);
      const auditorium = await auditoriumUsecase.getAuditoriumById(Number(auditoriumId));
  
      if (auditorium) {
        res.status(200).send(auditorium);
      } else {
        res.status(404).send({ error: "Auditorium not found" });
      }
    } catch (error) {
      console.log(error);
      res.status(500).send({ error: "Internal server error" });
    }
  });

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
  app.post("/auditoriums",authenticateToken, authorizeAdmin, async (req: Request, res: Response) => {
    const validation = auditoriumValidation.validate(req.body);

    if (validation.error) {
      res
        .status(400)
        .send(generateValidationErrorMessage(validation.error.details));
      return;
    }

    const auditoriumRequest = validation.value;
    const auditoriumRepo = AppDataSource.getRepository(Auditorium);
    try {
      const auditoriumCreated = await auditoriumRepo.save(auditoriumRequest);
      res.status(201).send(auditoriumCreated);
    } catch (error) {
      res.status(500).send({ error: "Internal error" });
    }
  });

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
  app.patch("/auditoriums/:id",authenticateToken, authorizeAdmin, async (req: Request, res: Response) => {
    const validation = updateAuditoriumValidation.validate({
      ...req.params,
      ...req.body,
    });

    if (validation.error) {
      res
        .status(400)
        .send(generateValidationErrorMessage(validation.error.details));
      return;
    }

    const updateAuditoriumReq = validation.value;

    try {
      const auditoriumUsecase = new AuditoriumUsecase(AppDataSource);
      const updatedAuditorium = await auditoriumUsecase.updateAuditorium(updateAuditoriumReq.id, {
        ...updateAuditoriumReq,
      });
      if (updatedAuditorium === null) {
        res.status(404).send({
          error: `auditorium ${updateAuditoriumReq.id} not found`,
        });
        return;
      }
      res.status(200).send(updatedAuditorium);
    } catch (error) {
      console.log(error);
      res.status(500).send({ error: "Internal error" });
    }
  });

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
  app.delete("/auditoriums/:id",authenticateToken, authorizeAdmin, async (req: Request, res: Response) => {
    const validation = deleteAuditoriumValidation.validate(req.params);

    if (validation.error) {
      res
        .status(400)
        .send(generateValidationErrorMessage(validation.error.details));
      return;
    }

    try {
      
      const auditoriumUsecase = new AuditoriumUsecase(AppDataSource);

      const deletedAuditorium = await auditoriumUsecase.deleteAuditoriumCollection(Number(req.params.id));

      if (deletedAuditorium) {
        res.status(200).send({
          message: "Auditorium removed successfully",
          auditorium: deletedAuditorium,
        });
      } else {
        res.status(404).send({ message: "Auditorium not found" });
      }
    } catch (error) {
      console.error(error); 
      res.status(500).send({ message: "Internal server error" });
    }
  });

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
  app.get("/auditoriums/:auditoriumId/schedules/:startDate",authenticateToken,  async (req: Request, res: Response) => {
    const validation = listAuditoriumScheduleValidation.validate(req.params);
  
    
    if (validation.error) {
      res
        .status(400)
        .send(generateValidationErrorMessage(validation.error.details));
      return;
    }

    const listAuditoriumScheduleReq = validation.value;
    let auditoriumId;
    let startDate=new Date;
    if (listAuditoriumScheduleReq.auditoriumId) {
      auditoriumId = listAuditoriumScheduleReq.auditoriumId;
    }
    if (listAuditoriumScheduleReq.startDate) {
      startDate = moment(listAuditoriumScheduleReq.startDate, 'YYYY-MM-DD').toDate();
    }

    try {
      const auditoriumUsecase = new AuditoriumUsecase(AppDataSource);
      const scheduleIds = await auditoriumUsecase.getAuditoriumSchedule(Number(auditoriumId), startDate);
    
      if (scheduleIds.length > 0) {
        res.status(200).send({
          message: "Schedule available : ",
          scheduleIds: scheduleIds,
        });
      } else {
        res.status(404).send({ message: "schedule not available" });
      }
    } catch (error) {
      console.log(error);
      console.error('Error:', (error as Error).message);
      res.status(500).send({ error: "Internal server error" });
    }
  });

};

