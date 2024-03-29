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
  movieId: number;
  auditoriumId:number
}

export const updateScheduleValidation = Joi.object<UpdateScheduleValidation>({
  id:Joi.number().required(),
  date: Joi.date().required(),
  movieId: Joi.number().required(),
  auditoriumId: Joi.number().required(),
});