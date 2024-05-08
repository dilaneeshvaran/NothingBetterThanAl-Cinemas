import Joi from "joi";

export interface UserValidation {
  id: number;
  name: string;
  password: string;
  role: 'admin' | 'client';
  token: string;
  balance: number;
}

export const userValidation = Joi.object<UserValidation>({
  id: Joi.number().required(),
  name: Joi.string().required(),
  password: Joi.string().required(),
  role: Joi.string().valid('admin', 'client').required(),
  token: Joi.string().required(),
  balance: Joi.number().required()
});

export interface DeleteUserValidation {
  id: number;
}

export const deleteUserValidation = Joi.object<DeleteUserValidation>({
  id: Joi.number().required(),
});

export interface UpdateUserValidation {
  id: number;
  name?: string;
  password?: string;
  role?: 'admin' | 'client';
  token?: string;
  balance?: number;
}

export const updateUserValidation = Joi.object<UpdateUserValidation>({
  id: Joi.number().required(),
  name: Joi.string().optional(),
  password: Joi.string().optional(),
  role: Joi.string().valid('admin', 'client').optional(),
  token: Joi.string().optional(),
  balance: Joi.number().optional()
});

export interface ListValidation {
  page?: number;
  limit?: number;
}

export const listValidation = Joi.object<ListValidation>({
  page: Joi.number().min(1).optional(),
  limit: Joi.number().min(1).optional(),
});