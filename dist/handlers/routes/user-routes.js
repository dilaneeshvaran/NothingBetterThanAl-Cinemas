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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initUserRoutes = exports.tokenRevocationList = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authMiddleware_1 = require("../middlewares/authMiddleware");
const user_validator_1 = require("../validators/user-validator");
const generate_validation_message_1 = require("../validators/generate-validation-message");
const database_1 = require("../../database/database");
const user_1 = require("../../database/entities/user");
const user_usecase_1 = require("../../domain/user-usecase");
exports.tokenRevocationList = [];
const initUserRoutes = (app) => {
    app.get("/health", (req, res) => {
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
    app.get("/users", authMiddleware_1.authenticateToken, authMiddleware_1.authorizeAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const validation = user_validator_1.listValidation.validate(req.query);
        if (validation.error) {
            res
                .status(400)
                .send((0, generate_validation_message_1.generateValidationErrorMessage)(validation.error.details));
            return;
        }
        const listUserReq = validation.value;
        let limit = 20;
        if (listUserReq.limit) {
            limit = listUserReq.limit;
        }
        const page = (_a = listUserReq.page) !== null && _a !== void 0 ? _a : 1;
        try {
            const userUsecase = new user_usecase_1.UserUsecase(database_1.AppDataSource);
            const listUser = yield userUsecase.listUser(Object.assign(Object.assign({}, listUserReq), { page,
                limit }));
            res.status(200).send(listUser);
        }
        catch (error) {
            console.log(error);
            res.status(500).send({ error: "Internal server error" });
        }
    }));
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
    app.get("/users/:userId", authMiddleware_1.authenticateToken, authMiddleware_1.authorizeAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const { userId } = req.params;
        try {
            const userUsecase = new user_usecase_1.UserUsecase(database_1.AppDataSource);
            const user = yield userUsecase.getUserById(Number(userId));
            if (user) {
                res.status(200).send(user);
            }
            else {
                res.status(404).send({ error: "User not found" });
            }
        }
        catch (error) {
            console.log(error);
            res.status(500).send({ error: "Internal server error" });
        }
    }));
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
    app.post("/users", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const validation = user_validator_1.userValidation.validate(req.body);
        if (validation.error) {
            res
                .status(400)
                .send((0, generate_validation_message_1.generateValidationErrorMessage)(validation.error.details));
            return;
        }
        const userRequest = validation.value;
        const userUsecase = new user_usecase_1.UserUsecase(database_1.AppDataSource);
        const isEmailExists = yield userUsecase.isEmailExists(userRequest.email);
        if (isEmailExists) {
            res.status(400).send({ message: "Email already in use" });
            return;
        }
        userRequest.password = yield userUsecase.hashPassword(userRequest.password);
        const userRepo = database_1.AppDataSource.getRepository(user_1.User);
        try {
            const userCreated = yield userRepo.save(userRequest);
            res.status(201).send(userCreated);
        }
        catch (error) {
            res.status(500).send({ error: "Internal error" });
        }
    }));
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
    app.patch("/users/:id", authMiddleware_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const validation = user_validator_1.updateUserValidation.validate(Object.assign(Object.assign({}, req.params), req.body));
        if (validation.error) {
            res
                .status(400)
                .send((0, generate_validation_message_1.generateValidationErrorMessage)(validation.error.details));
            return;
        }
        const updateUserReq = validation.value;
        try {
            const userUsecase = new user_usecase_1.UserUsecase(database_1.AppDataSource);
            const updatedUser = yield userUsecase.updateUser(updateUserReq.id, Object.assign({}, updateUserReq));
            if (updatedUser === null) {
                res.status(404).send({
                    error: `User ${updateUserReq.id} not found`,
                });
                return;
            }
            res.status(200).send(updatedUser);
        }
        catch (error) {
            console.log(error);
            res.status(500).send({ error: "Internal error" });
        }
    }));
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
    app.patch("/users/:id/role", authMiddleware_1.authenticateToken, authMiddleware_1.authorizeAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const { id } = req.params;
        const { role } = req.body;
        const userUsecase = new user_usecase_1.UserUsecase(database_1.AppDataSource);
        const updatedUser = yield userUsecase.changeUserRole(Number(id), role);
        if (updatedUser) {
            res.status(200).send(updatedUser);
        }
        else {
            res.status(404).send({ error: "User not found" });
        }
    }));
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
    app.delete("/users/:id", authMiddleware_1.authenticateToken, authMiddleware_1.authorizeAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const validation = user_validator_1.deleteUserValidation.validate(req.params);
        if (validation.error) {
            res
                .status(400)
                .send((0, generate_validation_message_1.generateValidationErrorMessage)(validation.error.details));
            return;
        }
        try {
            const userUsecase = new user_usecase_1.UserUsecase(database_1.AppDataSource);
            const deletedUser = yield userUsecase.deleteUser(Number(req.params.id));
            if (deletedUser) {
                res.status(200).send({
                    message: "User removed successfully",
                    user: deletedUser,
                });
            }
            else {
                res.status(404).send({ message: "User not found" });
            }
        }
        catch (error) {
            res.status(500).send({ message: "Internal server error" });
        }
    }));
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
    app.post("/users/login", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const validation = user_validator_1.authUserValidation.validate(req.body);
        if (validation.error) {
            res
                .status(400)
                .send((0, generate_validation_message_1.generateValidationErrorMessage)(validation.error.details));
            return;
        }
        const userRequest = validation.value;
        try {
            const userUsecase = new user_usecase_1.UserUsecase(database_1.AppDataSource);
            const user = yield userUsecase.getUserByEmail(userRequest.email);
            if (user) {
                const isPasswordMatch = yield userUsecase.comparePassword(userRequest.password, user.password);
                if (isPasswordMatch) {
                    // Generate JWT token when user authed
                    const token = jsonwebtoken_1.default.sign({ id: user.id, role: user.role }, 'your_secret_key', { expiresIn: '1h' });
                    res.status(200).send({ message: "User authenticated successfully", token });
                }
                else {
                    res.status(401).send({ message: "Invalid username or password" });
                }
            }
            else {
                res.status(401).send({ message: "Invalid username or password" });
            }
        }
        catch (error) {
            res.status(500).send({ error: "Internal error" });
        }
    }));
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
    app.post("/users/logout", authMiddleware_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        if (req.user && req.token) {
            exports.tokenRevocationList.push(req.token);
        }
        res.status(200).send({ message: "User logged out successfully" });
    }));
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
exports.initUserRoutes = initUserRoutes;
