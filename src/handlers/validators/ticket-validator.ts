import Joi from "joi";

export interface TicketValidation {
  userId?: number;
  price?: number;
  scheduleId: number;
  used?: boolean;
}

export const ticketValidation = Joi.object<TicketValidation>({
  userId: Joi.number().optional(),
  price: Joi.number().optional(),
  scheduleId: Joi.number().required(),
  used: Joi.boolean().optional()
});

export interface DeleteTicketValidation {
  id: number;
}

export const deleteTicketValidation = Joi.object<DeleteTicketValidation>({
  id: Joi.number().required(),
});

export interface UpdateTicketValidation {
  id:number;
  scheduleId?:number
  used?: boolean;
}

export const updateTicketValidation = Joi.object<UpdateTicketValidation>({
  id:Joi.number().required(),
  scheduleId: Joi.number().optional(),
  used: Joi.boolean().optional()
});

export interface ListValidation {
  page?: number;
  limit?: number;
}

export const listValidation = Joi.object<ListValidation>({
  page: Joi.number().min(1).optional(),
  limit: Joi.number().min(1).optional(),
});