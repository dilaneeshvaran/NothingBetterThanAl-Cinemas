"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listAuditoriumScheduleValidation = exports.updateAuditoriumValidation = exports.deleteAuditoriumValidation = exports.listValidation = exports.auditoriumValidation = void 0;
const joi_1 = __importDefault(require("joi"));
exports.auditoriumValidation = joi_1.default.object({
    name: joi_1.default.string().required(),
    description: joi_1.default.string().required(),
    imageUrl: joi_1.default.string().optional().uri(),
    type: joi_1.default.string().required(),
    capacity: joi_1.default.number().required().min(15).max(30),
    handicapAccessible: joi_1.default.boolean().optional(),
    maintenance: joi_1.default.boolean().optional()
});
exports.listValidation = joi_1.default.object({
    page: joi_1.default.number().min(1).optional(),
    limit: joi_1.default.number().min(1).optional(),
});
exports.deleteAuditoriumValidation = joi_1.default.object({
    id: joi_1.default.number().required(),
});
exports.updateAuditoriumValidation = joi_1.default.object({
    id: joi_1.default.number().required(),
    name: joi_1.default.string().optional(),
    description: joi_1.default.string().optional(),
    imageUrl: joi_1.default.string().optional().uri(),
    type: joi_1.default.string().optional(),
    capacity: joi_1.default.number().optional().min(15).max(30),
    handicapAccessible: joi_1.default.boolean().optional(),
    maintenance: joi_1.default.boolean().optional(),
});
exports.listAuditoriumScheduleValidation = joi_1.default.object({
    auditoriumId: joi_1.default.number().required(),
    startDate: joi_1.default.alternatives().try(joi_1.default.date(), joi_1.default.string()).required(),
});
