import express, { Request, Response } from "express";
import { authenticateToken, authorizeAdmin } from '../middlewares/authMiddleware';

import {
  movieValidation,
  deleteMovieValidation,
  updateMovieValidation,listValidation
} from "../validators/movie-validator";
import { generateValidationErrorMessage } from "../validators/generate-validation-message";
import { AppDataSource } from "../../database/database";
import { Movie } from "../../database/entities/movie";
import { MovieUsecase } from "../../domain/movie-usecase";
import { ScheduleUsecase } from "../../domain/schedule-usecase";

export const initMovieRoutes = (app: express.Express) => {
  app.get("/health", (req: Request, res: Response) => {
    res.send({ message: "hello world" });
  });

app.get("/movies",authenticateToken,  async (req: Request, res: Response) => {
  const validation = listValidation.validate(req.query);

  if (validation.error) {
    res
      .status(400)
      .send(generateValidationErrorMessage(validation.error.details));
    return;
  }

  const listMovieReq = validation.value;
  let limit = 20;
  if (listMovieReq.limit) {
    limit = listMovieReq.limit;
  }
  const page = listMovieReq.page ?? 1;

  try {
    const movieUsecase = new MovieUsecase(AppDataSource);
    const listMovie = await movieUsecase.listMovie({
      ...listMovieReq,
      page,
      limit,
    });
    res.status(200).send(listMovie);
  } catch (error) {
    console.log(error);
    res.status(500).send({ error: "Internal server error" });
  }
});

app.get("/movies/:movieId",authenticateToken,  async (req: Request, res: Response) => {
  const { movieId } = req.params;

  try {
    const movieUsecase = new MovieUsecase(AppDataSource);
    const scheduleUsecase = new ScheduleUsecase(AppDataSource);
    const movie = await movieUsecase.getMovieById(Number(movieId));
    const scheduleIds = await scheduleUsecase.getSchedulesByMovieId(Number(movieId));

    if (movie) {
      res.status(200).send({ movie, scheduleIds });
    } else {
      res.status(404).send({ error: "Movie not found" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send({ error: "Internal server error" });
  }
});

app.get("/movies/:movieId/schedules/:startDate/:endDate", authenticateToken, async (req: Request, res: Response) => {
  const { movieId, startDate, endDate } = req.params;

  try {
    const movieUsecase = new MovieUsecase(AppDataSource);
    const movie = await movieUsecase.getMovieById(Number(movieId));
    const schedules = await movieUsecase.getMovieScheduleBetween(Number(movieId), startDate, endDate);

    if (movie) {
      res.status(200).send({ movie, schedules });
    } else {
      res.status(404).send({ error: "Movie not found" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send({ error: "Internal server error" });
  }
});

  app.post("/movies",authenticateToken, authorizeAdmin, async (req: Request, res: Response) => {
    const validation = movieValidation.validate(req.body);
  
    if (validation.error) {
      res
        .status(400)
        .send(generateValidationErrorMessage(validation.error.details));
      return;
    }
  
    const movieRequest = validation.value;
    const movieRepo = AppDataSource.getRepository(Movie);
    
    try {
      const movieCreated = await movieRepo.save(movieRequest);
      res.status(201).send(movieCreated);
    } catch (error) {
      res.status(500).send({ error: "Internal error" });
    }
  });

  app.patch("/movies/:id",authenticateToken, authorizeAdmin, async (req: Request, res: Response) => {
    const validation = updateMovieValidation.validate({
      ...req.params,
      ...req.body,
    });

    if (validation.error) {
      res
        .status(400)
        .send(generateValidationErrorMessage(validation.error.details));
      return;
    }

    const updateMovieReq = validation.value;

    try {
      const movieUsecase = new MovieUsecase(AppDataSource);
      const updatedMovie = await movieUsecase.updateMovie(updateMovieReq.id, {
        ...updateMovieReq,
      });
      if (updatedMovie === null) {
        res.status(404).send({
          error: `movie ${updateMovieReq.id} not found`,
        });
        return;
      }
      res.status(200).send(updatedMovie);
    } catch (error) {
      console.log(error);
      res.status(500).send({ error: "Internal error" });
    }
  });

  app.delete("/movies/:id",authenticateToken, authorizeAdmin, async (req: Request, res: Response) => {
    const validation = deleteMovieValidation.validate(req.params);

    if (validation.error) {
      res
        .status(400)
        .send(generateValidationErrorMessage(validation.error.details));
      return;
    }

    try {
      
      const movieUsecase = new MovieUsecase(AppDataSource);

      const deletedMovie = await movieUsecase.deleteMovie(Number(req.params.id));

      if (deletedMovie) {
        res.status(200).send({
          message: "Movie removed successfully",
          movie: deletedMovie,
        });
      } else {
        res.status(404).send({ message: "Movie not found" });
      }
    } catch (error) {
      res.status(500).send({ message: "Internal server error" });
    }
  });

};

