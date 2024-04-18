import Joi from "joi";


export interface TicketValidation {
  price: number;
  movieId:number;
  scheduleId: number;
}

export const ticketValidation = Joi.object<TicketValidation>({
  price: Joi.string().required(),
  movieId:Joi.number().required(),
  scheduleId: Joi.number().required()
});

export interface DeleteTicketValidation {
  id: number;
}

export const deleteTicketValidation = Joi.object<DeleteTicketValidation>({
  id: Joi.number().required(),
});

export interface UpdateTicketValidation {
  id:number;
  price?: number;
  movieId?: number;
  scheduleId?:number
}

export const updateTicketValidation = Joi.object<UpdateTicketValidation>({
  id:Joi.number().required(),
  price: Joi.number().optional(),
  movieId: Joi.number().optional(),
  scheduleId: Joi.number().optional(),
});