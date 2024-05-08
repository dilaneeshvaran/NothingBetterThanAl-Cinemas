import Joi from "joi";


export interface ScheduleValidation {
  date: Date;
  movieId: number;
  auditoriumId:number;
  duration?:number;
}

export const scheduleValidation = Joi.object<ScheduleValidation>({
  date: Joi.date().required(),
  movieId: Joi.number().required(),
  auditoriumId: Joi.number().required(),
  duration:Joi.number().optional()
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
  movieId: number;
  auditoriumId:number
}

export const updateScheduleValidation = Joi.object<UpdateScheduleValidation>({
  id:Joi.number().optional(),
  date: Joi.date().optional(),
  movieId: Joi.number().optional(),
  auditoriumId: Joi.number().optional(),
});

export interface ListValidation {
  page?: number;
  limit?: number;
}

export const listValidation = Joi.object<ListValidation>({
  page: Joi.number().min(1).optional(),
  limit: Joi.number().min(1).optional(),
});