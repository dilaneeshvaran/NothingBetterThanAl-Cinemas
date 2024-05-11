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
import moment from "moment";

export const initMovieRoutes = (app: express.Express) => {
  app.get("/health", (req: Request, res: Response) => {
    res.send({ message: "hello world" });
  });

/**
 * @openapi
 * /movies:
 *   get:
 *     tags:
 *       - Movies
 *     description: List movies with pagination
 *     parameters:
 *       - name: page
 *         in: query
 *         required: false
 *         description: Page number for pagination
 *         schema:
 *           type: integer
 *       - name: limit
 *         in: query
 *         required: false
 *         description: Number of movies per page
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Movies retrieved successfully
 *       400:
 *         description: Validation error
 *       500:
 *         description: Internal server error
 */
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

/**
 * @openapi
 * /movies/{movieId}:
 *   get:
 *     tags:
 *       - Movies
 *     description: Get a specific movie by its ID and its associated schedules
 *     parameters:
 *       - name: movieId
 *         in: path
 *         required: true
 *         description: ID of the movie
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Movie retrieved successfully
 *       404:
 *         description: Movie not found
 *       500:
 *         description: Internal server error
 */
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

/**
 * @openapi
 * /movies/{movieId}/schedules/{startDate}/{endDate}:
 *   get:
 *     tags:
 *       - Movies
 *     summary: Get a movie and its schedules between two dates by movie ID
 *     parameters:
 *       - in: path
 *         name: movieId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The movie ID
 *       - in: path
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: The start date
 *       - in: path
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: The end date
 *     responses:
 *       200:
 *         description: The movie and its schedules were found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 movie:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                 schedules:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *       404:
 *         description: The movie was not found
 *       500:
 *         description: Internal server error
 */
app.get("/movies/:movieId/schedules/:startDate/:endDate", authenticateToken, async (req: Request, res: Response) => {
  const { movieId, startDate, endDate } = req.params;

  if (isNaN(Date.parse(startDate)) || isNaN(Date.parse(endDate))) {
    res.status(400).send({ error: "Invalid date format" });
    return;
  }
  if (!moment(startDate, 'YYYY-MM-DD', true).isValid() || !moment(endDate, 'YYYY-MM-DD', true).isValid()) {
    res.status(400).send({ error: "Invalid date format" });
    return;
  }

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

/**
 * @openapi
 * /movies:
 *   post:
 *     tags:
 *       - Movies
 *     description: Create a new movie
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/definitions/Movie'
 *     responses:
 *       201:
 *         description: Movie created successfully
 *       400:
 *         description: Validation error
 *       500:
 *         description: Internal server error
 */
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

/**
 * @openapi
 * /movies/{id}:
 *   patch:
 *     tags:
 *       - Movies
 *     description: Update a movie
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID of the movie to update
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/definitions/UpdateMovie'
 *     responses:
 *       200:
 *         description: Movie updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Movie not found
 *       500:
 *         description: Internal server error
 */
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

/**
 * @openapi
 * /movies/{id}:
 *   delete:
 *     tags:
 *       - Movies
 *     description: Delete a movie
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID of the movie to delete
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Movie deleted successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Movie not found
 *       500:
 *         description: Internal server error
 */
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
/**
 * @openapi
 * definitions:
 *   Movie:
 *     type: object
 *     properties:
 *       title:
 *         type: string
 *         description: The title of the movie
 *       description:
 *         type: string
 *         description: The description of the movie
 *       imageUrl:
 *         type: string
 *         description: The URL of the movie's image
 *       duration:
 *         type: integer
 *         description: The duration of the movie in minutes
 *     required:
 *       - title
 *       - description
 *       - duration
 */

/**
 * @openapi
 * definitions:
 *   UpdateMovie:
 *     type: object
 *     properties:
 *       title:
 *         type: string
 *         description: The title of the movie
 *       description:
 *         type: string
 *         description: The description of the movie
 *       imageUrl:
 *         type: string
 *         description: The URL of the movie's image
 *       duration:
 *         type: integer
 *         description: The duration of the movie in minutes
 */
};

