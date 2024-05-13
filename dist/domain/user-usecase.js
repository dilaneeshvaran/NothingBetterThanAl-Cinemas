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
exports.UserUsecase = void 0;
const user_1 = require("../database/entities/user");
const bcrypt_1 = __importDefault(require("bcrypt"));
class UserUsecase {
    constructor(db) {
        this.db = db;
    }
    listUser(listUser) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = this.db.createQueryBuilder(user_1.User, "users");
            query.skip((listUser.page - 1) * listUser.limit);
            query.take(listUser.limit);
            const [users, totalCount] = yield query.getManyAndCount();
            return {
                users,
                totalCount,
            };
        });
    }
    getUserById(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = this.db.createQueryBuilder(user_1.User, "users");
            query.where("users.id = :id", { id: userId });
            const user = yield query.getOne();
            if (!user) {
                throw new Error('User not found');
            }
            return user;
        });
    }
    getUserByEmail(email) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = this.db.createQueryBuilder(user_1.User, "users");
            query.where("users.email = :email", { email });
            const user = yield query.getOne();
            if (!user) {
                throw new Error('User not found');
            }
            return user;
        });
    }
    updateUser(id_1, _a) {
        return __awaiter(this, arguments, void 0, function* (id, { name, email, password }) {
            const repo = this.db.getRepository(user_1.User);
            const userFound = yield repo.findOneBy({ id });
            if (userFound === null)
                return null;
            if (email) {
                const emailExists = yield this.isEmailExists(email);
                if (emailExists && email !== userFound.email) {
                    throw new Error("Email already in use");
                }
                userFound.email = email;
            }
            if (name) {
                userFound.name = name;
            }
            if (password) {
                userFound.password = yield this.hashPassword(password);
            }
            const userUpdate = yield repo.save(userFound);
            return userUpdate;
        });
    }
    deleteUser(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const repo = this.db.getRepository(user_1.User);
            const userFound = yield repo.findOneBy({ id });
            if (!userFound)
                return null;
            yield repo.remove(userFound);
            return userFound;
        });
    }
    hashPassword(password) {
        return __awaiter(this, void 0, void 0, function* () {
            const saltRounds = 10;
            const hashedPassword = yield bcrypt_1.default.hash(password, saltRounds);
            return hashedPassword;
        });
    }
    comparePassword(password, hashedPassword) {
        return __awaiter(this, void 0, void 0, function* () {
            const match = yield bcrypt_1.default.compare(password, hashedPassword);
            return match;
        });
    }
    isEmailExists(email) {
        return __awaiter(this, void 0, void 0, function* () {
            const repo = this.db.getRepository(user_1.User);
            const user = yield repo.findOne({ where: { email } });
            return !!user;
        });
    }
    changeUserRole(userId, newRole) {
        return __awaiter(this, void 0, void 0, function* () {
            const repo = this.db.getRepository(user_1.User);
            const user = yield repo.findOne({ where: { id: userId } });
            if (!user) {
                return null;
            }
            user.role = newRole;
            const updatedUser = yield repo.save(user);
            return updatedUser;
        });
    }
}
exports.UserUsecase = UserUsecase;
