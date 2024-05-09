import {DataSource} from "typeorm";
import { Transaction, TransactionType } from "../database/entities/transaction";
import { User } from "../database/entities/user";

export class TransactionUsecase {
  constructor(private db: DataSource) {}

  async deposit(userId: number, amount: number): Promise<User | null> {
    const userRepo = this.db.getRepository(User);
    const user = await userRepo.findOne({ where: { id: userId } });

    if (!user) {
        return null;
    }

    user.balance += amount;
    const updatedUser = await userRepo.save(user);

    await this.recordTransaction(updatedUser.id, TransactionType.DEPOSIT, amount);

    return updatedUser;
  }

  async withdraw(userId: number, amount: number): Promise<User | null> {
    const userRepo = this.db.getRepository(User);
    const user = await userRepo.findOne({ where: { id: userId } });

    if (!user || user.balance < amount) {
        return null;
    }

    user.balance -= amount;
    const updatedUser = await userRepo.save(user);

    await this.recordTransaction(updatedUser.id, TransactionType.WITHDRAW, amount);

    return updatedUser;
  }

  async recordTransaction(userId: number, type: TransactionType, amount: number): Promise<Transaction> {
    const transactionRepo = this.db.getRepository(Transaction);

    const transaction = new Transaction();
    transaction.userId = userId;
    transaction.type = type;
    transaction.amount = amount;

    return await transactionRepo.save(transaction);
  }

  async getBalance(userId: number): Promise<number | null> {
    const userRepo = this.db.getRepository(User);
    const user = await userRepo.findOne({ where: { id: userId } });
  
    if (!user) {
      return null;
    }
  
    return user.balance;
  }

  async getAllTransactions(): Promise<Transaction[]> {
    const transactionRepo = this.db.getRepository(Transaction);
    const transactions = await transactionRepo.find();
    return transactions;
  }

  async getUserTransactions(userId: number): Promise<Transaction[]> {
    const transactionRepo = this.db.getRepository(Transaction);
    const transactions = await transactionRepo.find({ where: { userId: userId } });
    return transactions;
  }
}