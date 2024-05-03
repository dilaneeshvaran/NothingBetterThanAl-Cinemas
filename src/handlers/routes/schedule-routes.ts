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
import { Schedule } from "../../database/entities/schedule";
import { ScheduleUsecase } from "../../domain/schedule-usecase";

export const initScheduleRoutes = (app: express.Express) => {
  app.get("/health", (req: Request, res: Response) => {
    res.send({ message: "hello world" });
  });

  app.get("/schedules", async (req: Request, res: Response) => {
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

  app.get("/schedules/:scheduleId", async (req: Request, res: Response) => {
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

  app.get("/schedules/:startDate/:endDate", async (req: Request, res: Response) => {
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

app.post("/schedules", async (req: Request, res: Response) => {
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

  const scheduleUsecase = new ScheduleUsecase(AppDataSource);

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

  app.patch("/schedules/:id", async (req: Request, res: Response) => {
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


  app.delete("/schedules/:id", async (req: Request, res: Response) => {
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

