import express, { Request, Response } from "express";
import { authenticateToken, authorizeAdmin } from '../middlewares/authMiddleware';

import { RequestWithUser } from "../../types/request-with-user";
import { AppDataSource } from "../../database/database";
import { TransactionUsecase } from "../../domain/transaction-usecase";

export const initTransactionRoutes = (app: express.Express) => {
    app.get("/health", (req: Request, res: Response) => {
      res.send({ message: "hello world" });
    });
app.post("/transactions/deposit", authenticateToken, async (req: RequestWithUser, res: Response) => {
    const { amount } = req.body;
  
    if (!req.user) {
      res.status(401).send({ error: "Unauthorized" });
      return;
    }
  
    try {
      const transactionUsecase = new TransactionUsecase(AppDataSource);
      const updatedUser = await transactionUsecase.deposit(req.user.id, amount);
  
      if (updatedUser) {
        res.status(200).send({ message: "Deposit successful", balance: updatedUser.balance });
      } else {
        res.status(404).send({ message: "User not found or deposit fail" });
      }
    } catch (error) {
      res.status(500).send({ error: "Internal error" });
    }
});

app.post("/transactions/withdraw", authenticateToken, async (req: RequestWithUser, res: Response) => {
    const { amount } = req.body;
  
    if (!req.user) {
      res.status(401).send({ error: "Unauthorized" });
      return;
    }
  
    try {
      const transactionUsecase = new TransactionUsecase(AppDataSource);
      const updatedUser = await transactionUsecase.withdraw(req.user.id, amount);
  
      if (updatedUser) {
        res.status(200).send({ message: "Withdrawal successful", balance: updatedUser.balance });
      } else {
        res.status(400).send({ message: "User not found, insufficient balance, or withdrawal failed" });
      }
    } catch (error) {
      res.status(500).send({ error: "Internal error" });
    }
});

app.get("/transactions/balance", authenticateToken, async (req: RequestWithUser, res: Response) => {
  if (!req.user) {
    res.status(401).send({ error: "Unauthorized" });
    return;
  }

  try {
    const transactionUsecase = new TransactionUsecase(AppDataSource);
    const balance = await transactionUsecase.getBalance(req.user.id);

    if (balance !== null) {
      res.status(200).send({ balance });
    } else {
      res.status(404).send({ error: "User not found" });
    }
  } catch (error) {
    res.status(500).send({ error: "Internal error" });
  }
});

  app.get("/transactions/all", authenticateToken,authorizeAdmin, async (req: RequestWithUser, res: Response) => {
    try {
      const transactionUsecase = new TransactionUsecase(AppDataSource);
      const transactions = await transactionUsecase.getAllTransactions();
      res.status(200).send({ transactions });
    } catch (error) {
      res.status(500).send({ error: "Internal error" });
    }
  });

  app.get("/transactions", authenticateToken, async (req: RequestWithUser, res: Response) => {
    if (!req.user) {
      res.status(401).send({ error: "Unauthorized" });
      return;
    }
  
    try {
      const transactionUsecase = new TransactionUsecase(AppDataSource);
      const transactions = await transactionUsecase.getUserTransactions(req.user.id);
      res.status(200).send({ transactions });
    } catch (error) {
      res.status(500).send({ error: "Internal error" });
    }
  });
};