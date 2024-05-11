import express, { Request, Response } from "express";
import jwt from 'jsonwebtoken';
import { authenticateToken, authorizeAdmin } from '../middlewares/authMiddleware';

import {
  userValidation,
updateUserValidation,
deleteUserValidation,listValidation,authUserValidation
} from "../validators/user-validator";
import { generateValidationErrorMessage } from "../validators/generate-validation-message";
import { AppDataSource } from "../../database/database";
import { User } from "../../database/entities/user";
import { UserUsecase } from "../../domain/user-usecase";
import { RequestWithUser } from "../../types/request-with-user";

export let tokenRevocationList: string[] = [];

export const initUserRoutes = (app: express.Express) => {
  app.get("/health", (req: Request, res: Response) => {
    res.send({ message: "hello world" });
  });

/**
 * @openapi
 * /users:
 *   get:
 *     tags:
 *       - Users
 *     description: Returns all users
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: An array of users
 */
  app.get("/users",authenticateToken, authorizeAdmin, async (req: Request, res: Response) => {
    const validation = listValidation.validate(req.query);

    if (validation.error) {
      res
        .status(400)
        .send(generateValidationErrorMessage(validation.error.details));
      return;
    }

    const listUserReq = validation.value;
    let limit = 20;
    if (listUserReq.limit) {
      limit = listUserReq.limit;
    }
    const page = listUserReq.page ?? 1;

    try {
      const userUsecase = new UserUsecase(AppDataSource);
      const listUser = await userUsecase.listUser({
        ...listUserReq,
        page,
        limit,
      });
      res.status(200).send(listUser);
    } catch (error) {
      console.log(error);
      res.status(500).send({ error: "Internal server error" });
    }
  });

/**
 * @openapi
 * /users/{userId}:
 *   get:
 *     tags:
 *       - Users
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       '200':
 *         description: OK
 *       '404':
 *         description: User not found
 *       '500':
 *         description: Internal server error
 */
  app.get("/users/:userId",authenticateToken, authorizeAdmin, async (req: Request, res: Response) => {
    const { userId } = req.params;
  
    try {
      const userUsecase = new UserUsecase(AppDataSource);
      const user = await userUsecase.getUserById(Number(userId));
  
      if (user) {
        res.status(200).send(user);
      } else {
        res.status(404).send({ error: "User not found" });
      }
    } catch (error) {
      console.log(error);
      res.status(500).send({ error: "Internal server error" });
    }
  });

/**
 * @openapi
 * /users:
 *   post:
 *     tags:
 *       - Users
 *     description: Creates a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       201:
 *         description: Successfully created
 */
  app.post("/users", async (req: Request, res: Response) => {
    const validation = userValidation.validate(req.body);
  
    if (validation.error) {
      res
        .status(400)
        .send(generateValidationErrorMessage(validation.error.details));
      return;
    }
  
    const userRequest = validation.value;
  
    const userUsecase = new UserUsecase(AppDataSource);
  
    const isEmailExists = await userUsecase.isEmailExists(userRequest.email);
    if (isEmailExists) {
      res.status(400).send({ message: "Email already in use" });
      return;
    }
  
    userRequest.password = await userUsecase.hashPassword(userRequest.password);
  
    const userRepo = AppDataSource.getRepository(User);
  
    try {
      const userCreated = await userRepo.save(userRequest);
      res.status(201).send(userCreated);
    } catch (error) {
      res.status(500).send({ error: "Internal error" });
    }
  });

/**
 * @openapi
 * /users/{id}:
 *   patch:
 *     tags:
 *       - Users
 *     description: Updates a user
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: id
 *         description: User's id
 *         in: path
 *         required: true
 *         type: integer
 *       - in: body
 *         name: body
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             name:
 *               type: string
 *               description: The name of the user
 *             email:
 *               type: string
 *               description: The email of the user
 *             password:
 *               type: string
 *               description: The password of the user
 *     responses:
 *       200:
 *         description: Updated user
 *       400:
 *         description: Validation error
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal error
 */
app.patch("/users/:id",authenticateToken, async (req: Request, res: Response) => {
    const validation = updateUserValidation.validate({
      ...req.params,
      ...req.body,
    });
  
    if (validation.error) {
      res
        .status(400)
        .send(generateValidationErrorMessage(validation.error.details));
      return;
    }
  
    const updateUserReq = validation.value;
  
    try {
      const userUsecase = new UserUsecase(AppDataSource);
      const updatedUser = await userUsecase.updateUser(updateUserReq.id, {
        ...updateUserReq,
      });
      if (updatedUser === null) {
        res.status(404).send({
          error: `User ${updateUserReq.id} not found`,
        });
        return;
      }
      res.status(200).send(updatedUser);
    } catch (error) {
      console.log(error);
      res.status(500).send({ error: "Internal error" });
    }
  });

/**
 * @openapi
 * /users/{id}/role:
 *   patch:
 *     tags:
 *       - Users
 *     description: Changes a user's role
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *       - in: body
 *         name: role
 *         required: true
 *         schema:
 *           type: string
 *           enum: [admin, client]
 *     responses:
 *       200:
 *         description: Role updated successfully
 *       404:
 *         description: User not found
 */
  app.patch("/users/:id/role", authenticateToken, authorizeAdmin, async (req: Request, res: Response) => {
    const { id } = req.params;
    const { role } = req.body;

    const userUsecase = new UserUsecase(AppDataSource);
    const updatedUser = await userUsecase.changeUserRole(Number(id), role);

    if (updatedUser) {
        res.status(200).send(updatedUser);
    } else {
        res.status(404).send({ error: "User not found" });
    }
});

/**
 * @openapi
 * /users/{id}:
 *   delete:
 *     tags:
 *       - Users
 *     description: Deletes a user
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: id
 *         description: User's id
 *         in: path
 *         required: true
 *         type: integer
 *     responses:
 *       200:
 *         description: User removed successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
  app.delete("/users/:id",authenticateToken, authorizeAdmin, async (req: Request, res: Response) => {
    const validation = deleteUserValidation.validate(req.params);
  
    if (validation.error) {
      res
        .status(400)
        .send(generateValidationErrorMessage(validation.error.details));
      return;
    }
  
    try {
      const userUsecase = new UserUsecase(AppDataSource);
      const deletedUser = await userUsecase.deleteUser(Number(req.params.id));
  
      if (deletedUser) {
        res.status(200).send({
          message: "User removed successfully",
          user: deletedUser,
        });
      } else {
        res.status(404).send({ message: "User not found" });
      }
    } catch (error) {
      res.status(500).send({ message: "Internal server error" });
    }
  });

/**
 * @openapi
 * /users/login:
 *   post:
 *     tags:
 *       - Users
 *     description: Authenticates a user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: The email of the user
 *               password:
 *                 type: string
 *                 description: The password of the user
 *     responses:
 *       200:
 *         description: User authenticated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Invalid username or password
 *       500:
 *         description: Internal error
 */
  app.post("/users/login", async (req: Request, res: Response) => {
    const validation = authUserValidation.validate(req.body);
  
    if (validation.error) {
      res
        .status(400)
        .send(generateValidationErrorMessage(validation.error.details));
      return;
    }
  
    const userRequest = validation.value;
  
    try {
      const userUsecase = new UserUsecase(AppDataSource);
      const user = await userUsecase.getUserByEmail(userRequest.email);
  
      if (user) {
        const isPasswordMatch = await userUsecase.comparePassword(userRequest.password, user.password);
        if (isPasswordMatch) {
          // Generate JWT token when user authed
          const token = jwt.sign({ id: user.id, role: user.role }, 'your_secret_key', { expiresIn: '1h' });
          res.status(200).send({ message: "User authenticated successfully", token });
        } else {
          res.status(401).send({ message: "Invalid username or password" });
        }
      } else {
        res.status(401).send({ message: "Invalid username or password" });
      }
    } catch (error) {
      res.status(500).send({ error: "Internal error" });
    }
  });

/**
 * @openapi
 * /users/logout:
 *   post:
 *     tags:
 *       - Users
 *     description: Logs out a user
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: User logged out successfully
 *       400:
 *         description: Validation error
 *       500:
 *         description: Internal error
 */
app.post("/users/logout", authenticateToken, async (req: RequestWithUser, res: Response) => {
  if (req.user && req.token) {
    tokenRevocationList.push(req.token);
  }
  res.status(200).send({ message: "User logged out successfully" });
});
/**
 * @openapi
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - password
 *         - role
 *       properties:
 *         name:
 *           type: string
 *         password:
 *           type: string
 *         email:
 *           type: string
 *         role:
 *           type: string
 *           enum: [admin, client]
 */

/**
 * @openapi
 * components:
 *   schemas:
 *     UserLogin:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *         password:
 *           type: string
 *       example:
 *         email: user1@gmail.com
 *         password: passw0rd
 */
};

