"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listValidation = exports.updateUserValidation = exports.deleteUserValidation = exports.authUserValidation = exports.userValidation = void 0;
const joi_1 = __importDefault(require("joi"));
exports.userValidation = joi_1.default.object({
    name: joi_1.default.string().required(),
    email: joi_1.default.string().required(),
    password: joi_1.default.string().required(),
    role: joi_1.default.string().valid('admin', 'client').required(),
});
exports.authUserValidation = joi_1.default.object({
    email: joi_1.default.string().required(),
    password: joi_1.default.string().required(),
});
exports.deleteUserValidation = joi_1.default.object({
    id: joi_1.default.number().required(),
});
exports.updateUserValidation = joi_1.default.object({
    id: joi_1.default.number().required(),
    name: joi_1.default.string().optional(),
    email: joi_1.default.string().optional(),
    password: joi_1.default.string().optional(),
    role: joi_1.default.string().valid('admin', 'client').optional(),
    balance: joi_1.default.number().optional()
});
exports.listValidation = joi_1.default.object({
    page: joi_1.default.number().min(1).optional(),
    limit: joi_1.default.number().min(1).optional(),
});
