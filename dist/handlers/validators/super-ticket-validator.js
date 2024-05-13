"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listSuperTicketValidation = exports.updateSuperTicketValidation = exports.bookSuperTicketValidation = exports.deleteSuperTicketValidation = exports.buySuperTicketValidation = exports.superTicketValidation = void 0;
const joi_1 = __importDefault(require("joi"));
exports.superTicketValidation = joi_1.default.object({
    price: joi_1.default.number().optional(),
    userId: joi_1.default.number().optional(),
});
exports.buySuperTicketValidation = joi_1.default.object({
    price: joi_1.default.number().required(),
    userId: joi_1.default.number().required(),
});
exports.deleteSuperTicketValidation = joi_1.default.object({
    id: joi_1.default.number().required(),
});
exports.bookSuperTicketValidation = joi_1.default.object({
    id: joi_1.default.number().required(),
    scheduleId: joi_1.default.number().optional(),
    usedSchedules: joi_1.default.array().items(joi_1.default.number()).optional()
});
exports.updateSuperTicketValidation = joi_1.default.object({
    id: joi_1.default.number().required(),
    price: joi_1.default.number().optional(),
    usesRemaining: joi_1.default.number().optional(),
    usedSchedules: joi_1.default.array().items(joi_1.default.number()).optional()
});
exports.listSuperTicketValidation = joi_1.default.object({
    page: joi_1.default.number().min(1).optional(),
    limit: joi_1.default.number().min(1).optional(),
});
