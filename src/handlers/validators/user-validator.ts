import Joi from "joi";

export interface UserValidation {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'client';
}

export const userValidation = Joi.object<UserValidation>({
  name: Joi.string().required(),
  email: Joi.string().required(),
  password: Joi.string().required(),
  role: Joi.string().valid('admin', 'client').required(),
});

export interface AuthUserValidation {
  email: string;
  password: string;
}

export const authUserValidation = Joi.object<AuthUserValidation>({
  email: Joi.string().required(),
  password: Joi.string().required(),
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
  email?: string;
  password?: string;
  role?: 'admin' | 'client';
  balance?: number;
}

export const updateUserValidation = Joi.object<UpdateUserValidation>({
  id: Joi.number().required(),
  name: Joi.string().optional(),
  email: Joi.string().optional(),
  password: Joi.string().optional(),
  role: Joi.string().valid('admin', 'client').optional(),
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