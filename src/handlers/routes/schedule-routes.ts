import express, { Request, Response } from "express";
import { authenticateToken, authorizeAdmin } from '../middlewares/authMiddleware';

import {
  scheduleValidation,
updateScheduleValidation,
deleteScheduleValidation,listValidation
} from "../validators/schedule-validator";
import { generateValidationErrorMessage } from "../validators/generate-validation-message";
import { AppDataSource } from "../../database/database";
import { Schedule } from "../../database/entities/schedule";
import { ScheduleUsecase } from "../../domain/schedule-usecase";
import { Movie } from "../../database/entities/movie";
import { Auditorium } from "../../database/entities/auditorium";

export const initScheduleRoutes = (app: express.Express) => {
  app.get("/health", (req: Request, res: Response) => {
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
  app.get("/schedules",authenticateToken, authorizeAdmin, async (req: Request, res: Response) => {
    const validation = listValidation.validate(req.query);

    if (validation.error) {
      res
        .status(400)
        .send(generateValidationErrorMessage(validation.error.details));
      return;
    }

    const listScheduleReq = validation.value;
    let limit = 20;
    if (listScheduleReq.limit) {
      limit = listScheduleReq.limit;
    }
    const page = listScheduleReq.page ?? 1;

    try {
      const scheduleUsecase = new ScheduleUsecase(AppDataSource);
      const listSchedule = await scheduleUsecase.listSchedule({
        ...listScheduleReq,
        page,
        limit,
      });
      res.status(200).send(listSchedule);
    } catch (error) {
      console.log(error);
      res.status(500).send({ error: "Internal server error" });
    }
  });

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
  app.get("/schedules/:scheduleId", authenticateToken, async (req: Request, res: Response) => {
    const { scheduleId } = req.params;
  
    try {
      const scheduleUsecase = new ScheduleUsecase(AppDataSource);
      const schedule = await scheduleUsecase.getScheduleById(Number(scheduleId));
  
      if (schedule) {
        res.status(200).send(schedule);
      } else {
        res.status(404).send({ error: "Schedule not found" });
      }
    } catch (error) {
      console.log(error);
      res.status(500).send({ error: "Internal server error" });
    }
  });

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
  app.get("/schedules/:startDate/:endDate",authenticateToken,  async (req: Request, res: Response) => {
    const { startDate, endDate } = req.params;
  
    try {
      const scheduleUsecase = new ScheduleUsecase(AppDataSource);
      const schedule = await scheduleUsecase.getScheduleBetween(startDate, endDate);
  
      if (schedule) {
        res.status(200).send(schedule);
      } else {
        res.status(404).send({ error: "Schedule not found" });
      }
    } catch (error) {
      console.log(error);
      res.status(500).send({ error: "Internal server error" });
    }
});

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
app.post("/schedules",authenticateToken, authorizeAdmin, async (req: Request, res: Response) => {
  const validation = scheduleValidation.validate(req.body);

  if (validation.error) {
    res
      .status(400)
      .send(generateValidationErrorMessage(validation.error.details));
    return;
  }

  const scheduleRequest = validation.value;
  scheduleRequest.date = new Date(scheduleRequest.date);

  const scheduleRepo = AppDataSource.getRepository(Schedule);
  const movieRepo = AppDataSource.getRepository(Movie);
  const auditoriumRepo = AppDataSource.getRepository(Auditorium);

  // Check if movie exists
  const movie = await movieRepo.findOne({ where: { id: scheduleRequest.movieId } });
  if (!movie) {
    res.status(400).send({ error: "Movie does not exist" });
    return;
  }

  // Check if auditorium exists
  const auditorium = await auditoriumRepo.findOne({ where: { id: scheduleRequest.auditoriumId } });
  if (!auditorium) {
    res.status(400).send({ error: "Auditorium does not exist" });
    return;
  }

  const scheduleUsecase = new ScheduleUsecase(AppDataSource);

  // Check if schedule date is not in the past
  if (!scheduleUsecase.isCorrectDate(scheduleRequest as Schedule)) {
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

  if (await scheduleUsecase.doesOverlap(scheduleRequest as Schedule)) {
    res.status(400).send({ error: "Overlapping schedules are not allowed" });
    return;
  }

  try {
    const scheduleCreated = await scheduleRepo.save(scheduleRequest);
    res.status(201).send(scheduleCreated);
  } catch (error) {
    res.status(500).send({ error: "Internal error" });
  }
});

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
  app.patch("/schedules/:id",authenticateToken, authorizeAdmin, async (req: Request, res: Response) => {
    const validation = updateScheduleValidation.validate({
      ...req.params,
      ...req.body,
    });

    if (validation.error) {
      res
        .status(400)
        .send(generateValidationErrorMessage(validation.error.details));
      return;
    }

    const updateScheduleReq = validation.value;

    try {
      const scheduleUsecase = new ScheduleUsecase(AppDataSource);
      const updatedSchedule = await scheduleUsecase.updateSchedule(updateScheduleReq.id, {
        ...updateScheduleReq,
      });
      if (updatedSchedule === null) {
        res.status(404).send({
          error: `schedule ${updateScheduleReq.id} not found`,
        });
        return;
      }
      res.status(200).send(updatedSchedule);
    } catch (error) {
      console.log(error);
      res.status(500).send({ error: "Internal error" });
    }
  });

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
  app.delete("/schedules/:id",authenticateToken, authorizeAdmin, async (req: Request, res: Response) => {
    const validation = deleteScheduleValidation.validate(req.params);

    if (validation.error) {
      res
        .status(400)
        .send(generateValidationErrorMessage(validation.error.details));
      return;
    }

    try {
      
      const scheduleUsecase = new ScheduleUsecase(AppDataSource);

      const deletedSchedule = await scheduleUsecase.deleteSchedule(Number(req.params.id));

      if (deletedSchedule) {
        res.status(200).send({
          message: "Schedule removed successfully",
          auditorium: deletedSchedule,
        });
      } else {
        res.status(404).send({ message: "Schedule not found" });
      }
    } catch (error) {
      res.status(500).send({ message: "Internal server error" });
    }
  });
};

