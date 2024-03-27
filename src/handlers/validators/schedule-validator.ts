import Joi from "joi";
import { Movie } from "../../database/entities/movie"
import { Auditorium } from "../../database/entities/auditorium"


export interface ScheduleValidation {
  date: Date;
  movie: Movie;
  duration:number;
  auditorium:Auditorium
}

export const scheduleValidation = Joi.object<ScheduleValidation>({
  date: Joi.date().required(),
  movie: Joi.object(Movie).required(),
  duration:Joi.number().required(),
  auditorium: Joi.object(Auditorium).required(),
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
  movie: Movie;
  auditorium:Auditorium
}

export const updateScheduleValidation = Joi.object<UpdateScheduleValidation>({
  id:Joi.number().required(),
  date: Joi.date().required(),
  movie: Joi.object(Movie).required(),
  auditorium: Joi.object(Auditorium).required(),
});