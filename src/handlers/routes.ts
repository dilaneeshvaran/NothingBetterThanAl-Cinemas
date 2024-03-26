import express, { Request, Response } from "express";
import {
    auditoriumValidation,
  listAuditoriumValidation,
  deleteAuditoriumValidation,
  updateAuditoriumValidation,
  listAuditoriumScheduleValidation,
} from "./validators/auditorium-validator";
import {
  scheduleValidation,
listScheduleValidation,
updateScheduleValidation,
deleteScheduleValidation
} from "./validators/schedule-validator";
import { generateValidationErrorMessage } from "./validators/generate-validation-message";
import { AppDataSource } from "../database/database";
import { Auditorium } from "../database/entities/auditorium";
import { Schedule } from "../database/entities/schedule";
import { AuditoriumUsecase } from "../domain/auditorium-usecase";
import { ScheduleUsecase } from "../domain/schedule-usecase";

export const initRoutes = (app: express.Express) => {
  app.get("/health", (req: Request, res: Response) => {
    res.send({ message: "hello world" });
  });

  app.get("/auditoriums", async (req: Request, res: Response) => {
    const validation = listAuditoriumValidation.validate(req.query);

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


  app.post("/auditoriums", async (req: Request, res: Response) => {
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

  app.patch("/auditoriums/:id", async (req: Request, res: Response) => {
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


  app.delete("/auditoriums", async (req: Request, res: Response) => {
    const validation = deleteAuditoriumValidation.validate(req.body);

    if (validation.error) {
      res
        .status(400)
        .send(generateValidationErrorMessage(validation.error.details));
      return;
    }

    try {
      
      const auditoriumUsecase = new AuditoriumUsecase(AppDataSource);

      const deletedAuditorium = await auditoriumUsecase.deleteAuditoriumCollection(req.body.id);

      if (deletedAuditorium) {
        res.status(200).send({
          message: "Auditorium removed successfully",
          auditorium: deletedAuditorium,
        });
      } else {
        res.status(404).send({ message: "Auditorium not found" });
      }
    } catch (error) {
      res.status(500).send({ message: "Internal server error" });
    }
  });


  app.get("/auditoriums/:auditoriumId/schedule/:startDate", async (req: Request, res: Response) => {
    const validation = listAuditoriumScheduleValidation.validate(req.query);
  
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
      startDate = listAuditoriumScheduleReq.startDate;
    }

    try {
    const auditoriumUsecase = new AuditoriumUsecase(AppDataSource);
    const schedule = await auditoriumUsecase.getAuditoriumSchedule(Number(auditoriumId), startDate);
  
    //maybe try res.status(200).json({ schedule });
    if (schedule) {
      res.status(200).send({
        message: "Schedule available : ",
        schedule: schedule,
      });
    } else {
      res.status(404).send({ message: "schedule not available" });
    }
  }catch (error) {
      console.log(error);
      res.status(500).send({ error: "Internal server error" });
    }
  });

/*--------------------------------------Schedules---------------------------------------------*/


  app.get("/schedules", async (req: Request, res: Response) => {
    const validation = listScheduleValidation.validate(req.query);

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

  app.post("/schedules", async (req: Request, res: Response) => {
    const validation = scheduleValidation.validate(req.body);

    if (validation.error) {
      res
        .status(400)
        .send(generateValidationErrorMessage(validation.error.details));
      return;
    }

    const scheduleRequest = validation.value;
    const scheduleRepo = AppDataSource.getRepository(Schedule);
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


  app.delete("/schedules", async (req: Request, res: Response) => {
    const validation = deleteScheduleValidation.validate(req.body);

    if (validation.error) {
      res
        .status(400)
        .send(generateValidationErrorMessage(validation.error.details));
      return;
    }

    try {
      
      const scheduleUsecase = new ScheduleUsecase(AppDataSource);

      const deletedSchedule = await scheduleUsecase.deleteSchedule(req.body.id);

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



