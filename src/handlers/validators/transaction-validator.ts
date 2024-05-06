import Joi from "joi";

export interface TransactionValidation {
  date: Date;
  amount: number;
  description: string;
  scheduleId: number;
}

export const transactionValidation = Joi.object<TransactionValidation>({
  date: Joi.date().required(),
  amount: Joi.number().required(),
  description: Joi.string().required(),
  scheduleId: Joi.number().required()
});

export interface DeleteTransactionValidation {
  id: number;
}

export const DeleteTransactionValidation = Joi.
object<DeleteTransactionValidation>({
  id: Joi.number().required(),
})

export interface UpdateTransactionValidation {
  id: number;
  date: Date;
  amount: number;
  description: string;
  scheduleId: number
}

export const UpdateTransactionValidation = Joi.
object<UpdateTransactionValidation>({
  id: Joi.number().required(),
  date: Joi.date().required(),
  amount: Joi.number().required(),
  description: Joi.string().required(),
  scheduleId: Joi.number().required(),
})