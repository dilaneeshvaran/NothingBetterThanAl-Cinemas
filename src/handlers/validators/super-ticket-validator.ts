import Joi from "joi";

export interface SuperTicketValidation {
  price?: number;
  userId?: number;
}

export const superTicketValidation = Joi.object<SuperTicketValidation>({
  price: Joi.number().optional(),
  userId: Joi.number().optional(),
});

export const buySuperTicketValidation = Joi.object<SuperTicketValidation>({
  price: Joi.number().required(),
  userId: Joi.number().required(),
});

export interface DeleteSuperTicketValidation {
  id: number;
}

export const deleteSuperTicketValidation = Joi.object<DeleteSuperTicketValidation>({
  id: Joi.number().required(),
});

export interface UpdateSuperTicketValidation {
  id: number;
  price?: number;
  usesRemaining?: number;
  usedSchedules?: number[];
}

export interface BookSuperTicketValidation {
  id: number;
  scheduleId?: number;
  usedSchedules?: number[];
}

export const bookSuperTicketValidation = Joi.object<BookSuperTicketValidation>({
  id: Joi.number().required(),
  scheduleId: Joi.number().optional(),
  usedSchedules: Joi.array().items(Joi.number()).optional()
});

export const updateSuperTicketValidation = Joi.object<UpdateSuperTicketValidation>({
  id: Joi.number().required(),
  price: Joi.number().optional(),
  usesRemaining: Joi.number().optional(),
  usedSchedules: Joi.array().items(Joi.number()).optional()
});

export interface ListSuperTicketValidation {
  page?: number;
  limit?: number;
}

export const listSuperTicketValidation = Joi.object<ListSuperTicketValidation>({
  page: Joi.number().min(1).optional(),
  limit: Joi.number().min(1).optional(),
});