import express, { Request, Response } from "express";
import { authenticateToken, authorizeAdmin } from '../middlewares/authMiddleware';

import { RequestWithUser } from "../../types/request-with-user";
import { AppDataSource } from "../../database/database";
import { TransactionUsecase } from "../../domain/transaction-usecase";

export const initTransactionRoutes = (app: express.Express) => {
    app.get("/health", (req: Request, res: Response) => {
      res.send({ message: "hello world" });
    });

/**
 * @openapi
 * /transactions/deposit:
 *   post:
 *     tags:
 *       - Transactions
 *     summary: Deposit an amount to the user's account
 *     description: This endpoint allows a user to deposit a certain amount to their account. The user must be authenticated to perform this operation.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *                 description: The amount to be deposited.
 *     responses:
 *       '200':
 *         description: Deposit successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Deposit successful"
 *                 balance:
 *                   type: number
 *                   description: The updated balance after the deposit.
 *       '401':
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Unauthorized"
 *       '404':
 *         description: User not found or deposit fail
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User not found or deposit fail"
 *       '500':
 *         description: Internal error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Internal error"
 */
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

/**
 * @openapi
 * /transactions/withdraw:
 *   post:
 *     tags:
 *       - Transactions
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *     responses:
 *       '200':
 *         description: OK
 *       '400':
 *         description: Bad Request
 *       '401':
 *         description: Unauthorized
 *       '500':
 *         description: Internal Server Error
 */
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

/**
 * @openapi
 * /transactions/balance:
 *   get:
 *     tags:
 *       - Transactions
 *     description: Get the balance of the authenticated user
 *     responses:
 *       200:
 *         description: Successful operation
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal error
 */
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

/**
 * @openapi
 * /transactions/all:
 *   get:
 *     tags:
 *       - Transactions
 *     description: Get all transactions (Admin only)
 *     responses:
 *       200:
 *         description: Successful operation
 *       500:
 *         description: Internal error
 */
  app.get("/transactions/all", authenticateToken,authorizeAdmin, async (req: RequestWithUser, res: Response) => {
    try {
      const transactionUsecase = new TransactionUsecase(AppDataSource);
      const transactions = await transactionUsecase.getAllTransactions();
      res.status(200).send({ transactions });
    } catch (error) {
      res.status(500).send({ error: "Internal error" });
    }
  });

  /**
 * @openapi
 * /transactions:
 *   get:
 *     tags:
 *       - Transactions
 *     description: Get the transactions of the authenticated user
 *     responses:
 *       200:
 *         description: Successful operation
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal error
 */
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