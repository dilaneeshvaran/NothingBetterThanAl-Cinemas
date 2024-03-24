import Joi from "joi";

export const auditoriumValidation = Joi.object<AuditoriumValidation>({
  id: Joi.number().required(),
  seats: Joi.number(),
});

export interface AuditoriumValidation {
  id: number;
  seats: number;
}

export const listAuditoriumValidation = Joi.object<ListAuditoriumValidation>({
  page: Joi.number().min(1).optional(),
  limit: Joi.number().min(1).optional(),
});

export interface ListAuditoriumValidation {
  page?: number;
  limit?: number;
}

export interface DeleteAuditoriumValidation {
  id: number;
}

export const deleteAuditoriumValidation = Joi.object<DeleteAuditoriumValidation>({
  id: Joi.number().required(),
});

export const updateAuditoriumValidation = Joi.object<UpdateAuditoriumRequest>({
  id: Joi.number().required(),
  seats: Joi.number().min(1).required(),
});

export interface UpdateAuditoriumRequest {
  id: number;
  seats: number;
}
