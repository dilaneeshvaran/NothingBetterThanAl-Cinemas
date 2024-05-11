import Joi from "joi";
import { Image } from "../../database/entities/image"


export interface AuditoriumValidation {
  name: string;
  description: string;
  imageUrl?: string;
  type: string;
  capacity: number;
  handicapAccessible?: boolean;
  maintenance?:boolean;
}

export const auditoriumValidation = Joi.object<AuditoriumValidation>({
  name: Joi.string().required(),
  description: Joi.string().required(),
  imageUrl: Joi.string().optional().uri(),
  type: Joi.string().required(),
  capacity: Joi.number().required().min(15).max(30),
  handicapAccessible: Joi.boolean().optional(),
  maintenance: Joi.boolean().optional()
});

export interface ListValidation {
  page?: number;
  limit?: number;
}

export const listValidation = Joi.object<ListValidation>({
  page: Joi.number().min(1).optional(),
  limit: Joi.number().min(1).optional(),
});

export interface DeleteAuditoriumValidation {
  id: number;
}

export const deleteAuditoriumValidation = Joi.object<DeleteAuditoriumValidation>({
  id: Joi.number().required(),
});

export interface UpdateAuditoriumRequest {
  id: number;
  name?: string;
  description?: string;
  imageUrl?: string;
  type?: string;
  capacity?: number;
  handicapAccessible?: boolean;
  maintenance?:boolean;
}

export const updateAuditoriumValidation = Joi.object<UpdateAuditoriumRequest>({
  id: Joi.number().required(),
  name: Joi.string().optional(),
  description: Joi.string().optional(),
  imageUrl: Joi.string().optional().uri(),
  type: Joi.string().optional(),
  capacity: Joi.number().optional().min(15).max(30),
  handicapAccessible: Joi.boolean().optional(),
  maintenance: Joi.boolean().optional(),
});

export interface ListAuditoriumScheduleRequest {
  auditoriumId: number,
  startDate: Date | string,
}

export const listAuditoriumScheduleValidation = Joi.object<ListAuditoriumScheduleRequest>({
  auditoriumId: Joi.number().required(),
  startDate: Joi.alternatives().try(Joi.date(), Joi.string()).required(),});