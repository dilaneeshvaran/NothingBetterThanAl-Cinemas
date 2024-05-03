import Joi from "joi";


export interface MovieValidation {
  title: string;
  description:string;
  imageUrl?: string;
  duration:number
}

export const movieValidation = Joi.object<MovieValidation>({
  title: Joi.string().required(),
  description:Joi.string().required(),
  imageUrl: Joi.string().optional().uri(),
  duration: Joi.number().required(),
});

export interface DeleteMovieValidation {
  id: number;
}

export const deleteMovieValidation = Joi.object<DeleteMovieValidation>({
  id: Joi.number().required(),
});

export interface UpdateMovieValidation {
  id:number;
  description?: string;
  imageUrl?: string;
  duration?:number
}

export const updateMovieValidation = Joi.object<UpdateMovieValidation>({
  id:Joi.number().required(),
  description: Joi.string().optional(),
  imageUrl: Joi.string().optional().uri(),
  duration: Joi.number().optional(),
});

export interface ListValidation {
  page?: number;
  limit?: number;
}

export const listValidation = Joi.object<ListValidation>({
  page: Joi.number().min(1).optional(),
  limit: Joi.number().min(1).optional(),
});