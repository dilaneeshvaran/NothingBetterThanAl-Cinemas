import Joi from "joi";
import { Movie } from "../../database/entities/movie"
import { Auditorium } from "../../database/entities/auditorium"

const movieSchema = Joi.object({
  // define properties here
});

const auditoriumSchema = Joi.object({
  // define properties here
});

export interface ScheduleValidation {
  date: Date;
  //movie: Movie;
  duration:number;
  //auditorium:Auditorium
  auditorium: string,
    movie:string
}

export const scheduleValidation = Joi.object<ScheduleValidation>({
  date: Joi.date().required(),
  //movie: Joi.object(Movie).required(),
  duration:Joi.number().required(),
  //auditorium: Joi.object(Auditorium).required(),
  auditorium: Joi.string,
    movie:Joi.string
});


export interface ListScheduleValidation {
  page?: number;
  limit?: number;
}

export const listScheduleValidation = Joi.object<ListScheduleValidation>({
  page: Joi.number().min(1).optional(),
  limit: Joi.number().min(1).optional(),
});

export interface DeleteScheduleValidation {
  id: number;
}

export const deleteScheduleValidation = Joi.object<DeleteScheduleValidation>({
  id: Joi.number().required(),
});

export interface UpdateScheduleValidation {
  id:number;
  date: Date;
  //movie: Movie;
  //auditorium:Auditorium
  movie: string;
  auditorium:string
}

export const updateScheduleValidation = Joi.object<UpdateScheduleValidation>({
  id:Joi.number().required(),
  date: Joi.date().required(),
  //movie: Joi.object(Movie).required(),
  //auditorium: Joi.object(Auditorium).required(),
    auditorium: Joi.string,
    movie:Joi.string
});