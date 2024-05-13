"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionUsecase = void 0;
const transaction_1 = require("../database/entities/transaction");
const user_1 = require("../database/entities/user");
class TransactionUsecase {
    constructor(db) {
        this.db = db;
    }
    deposit(userId, amount) {
        return __awaiter(this, void 0, void 0, function* () {
            const userRepo = this.db.getRepository(user_1.User);
            const user = yield userRepo.findOne({ where: { id: userId } });
            if (!user) {
                return null;
            }
            user.balance += amount;
            const updatedUser = yield userRepo.save(user);
            yield this.recordTransaction(updatedUser.id, transaction_1.TransactionType.DEPOSIT, amount);
            return updatedUser;
        });
    }
    withdraw(userId, amount) {
        return __awaiter(this, void 0, void 0, function* () {
            const userRepo = this.db.getRepository(user_1.User);
            const user = yield userRepo.findOne({ where: { id: userId } });
            if (!user || user.balance < amount) {
                return null;
            }
            user.balance -= amount;
            const updatedUser = yield userRepo.save(user);
            yield this.recordTransaction(updatedUser.id, transaction_1.TransactionType.WITHDRAW, amount);
            return updatedUser;
        });
    }
    recordTransaction(userId, type, amount) {
        return __awaiter(this, void 0, void 0, function* () {
            const transactionRepo = this.db.getRepository(transaction_1.Transaction);
            const transaction = new transaction_1.Transaction();
            transaction.userId = userId;
            transaction.type = type;
            transaction.amount = amount;
            return yield transactionRepo.save(transaction);
        });
    }
    getBalance(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const userRepo = this.db.getRepository(user_1.User);
            const user = yield userRepo.findOne({ where: { id: userId } });
            if (!user) {
                return null;
            }
            return user.balance;
        });
    }
    getAllTransactions() {
        return __awaiter(this, void 0, void 0, function* () {
            const transactionRepo = this.db.getRepository(transaction_1.Transaction);
            const transactions = yield transactionRepo.find();
            return transactions;
        });
    }
    getUserTransactions(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const transactionRepo = this.db.getRepository(transaction_1.Transaction);
            const transactions = yield transactionRepo.find({ where: { userId: userId } });
            return transactions;
        });
    }
}
exports.TransactionUsecase = TransactionUsecase;
