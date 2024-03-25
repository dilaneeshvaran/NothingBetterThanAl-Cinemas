import Joi from "joi";
import { Image } from "../../database/entities/image"


export interface AuditoriumValidation {
  name: string;
  description: string;
  imageUrl: string;
  type: string;
  capacity: number;
  handicapAccessible: boolean;
}

export const auditoriumValidation = Joi.object<AuditoriumValidation>({
  name: Joi.string().required(),
  description: Joi.string().required(),
  imageUrl: Joi.string().optional().uri(),
  type: Joi.string().required(),
  capacity: Joi.number().required().min(1),
  handicapAccessible: Joi.boolean().optional(),
});

export interface ListAuditoriumValidation {
  page?: number;
  limit?: number;
}

export const listAuditoriumValidation = Joi.object<ListAuditoriumValidation>({
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
}

export const updateAuditoriumValidation = Joi.object<UpdateAuditoriumRequest>({
  id: Joi.number().required(),
  name: Joi.string().optional(),
  description: Joi.string().optional(),
  imageUrl: Joi.string().optional().uri(),
  type: Joi.string().optional(),
  capacity: Joi.number().optional().min(1),
  handicapAccessible: Joi.boolean().optional(),
});