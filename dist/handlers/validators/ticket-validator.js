"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listValidation = exports.updateTicketValidation = exports.deleteTicketValidation = exports.ticketValidation = void 0;
const joi_1 = __importDefault(require("joi"));
exports.ticketValidation = joi_1.default.object({
    userId: joi_1.default.number().optional(),
    price: joi_1.default.number().optional(),
    scheduleId: joi_1.default.number().required(),
    used: joi_1.default.boolean().optional()
});
exports.deleteTicketValidation = joi_1.default.object({
    id: joi_1.default.number().required(),
});
exports.updateTicketValidation = joi_1.default.object({
    id: joi_1.default.number().required(),
    scheduleId: joi_1.default.number().optional(),
    used: joi_1.default.boolean().optional()
});
exports.listValidation = joi_1.default.object({
    page: joi_1.default.number().min(1).optional(),
    limit: joi_1.default.number().min(1).optional(),
});
