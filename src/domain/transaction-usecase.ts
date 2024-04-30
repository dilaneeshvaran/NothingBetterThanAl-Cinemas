import { DataSource } from "typeorm";
import { Transaction } from "../database/entities/transaction";

export interface ListTransaction {
  limit: number;
  page: number;
}

export interface UpdateTransactionParams {
  id: number;
  date: Date;
  amount: number;
  description: string;
  scheduleId: number;
}

export class TransactionUsecase {
  constructor(private readonly db: DataSource) {}

  async listTransaction(
    listTransaction: ListTransaction
  ) : Promise<{ transactions: Transaction[]; totalCount: number}>
  {
    const query = this.db.createQueryBuilder(Transaction, "transactions");

    query.skip((listTransaction.page - 1) * listTransaction.limit);
    query.take(listTransaction.limit);

    const [transactions, totalCount] = await query.getManyAndCount();

    return {
      transactions,
      totalCount,
    };
  }

  async getTransactionById(transactionId: number): 
  Promise<Transaction> {
    const query = this.db.createQueryBuilder(Transaction, "transactions");

    query.where("transactions.id = :id", { id: transactionId });

    const transaction = await query.getOne();

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    return transaction;
  } 

  async updateTransaction(
    id: number,
    { date, amount, description, scheduleId }: UpdateTransactionParams
  ): Promise<Transaction | null> {
    const repo = this.db.getRepository(Transaction);
    const transactionFound = await repo.findOneBy({ id });
    if (transactionFound === null) return null;

    if (date) {
      transactionFound.date = date;
    }

    if (amount) {
      transactionFound.amount = amount;
    }

    if (description) {
      transactionFound.description = description;
    }

    if (scheduleId) {
      transactionFound.scheduleId = scheduleId;
    }
    const transactionUpdate = await repo.save(transactionFound);
    return transactionUpdate;
  }
}