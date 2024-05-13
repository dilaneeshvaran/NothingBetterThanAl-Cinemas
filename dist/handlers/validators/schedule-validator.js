"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listValidation = exports.updateScheduleValidation = exports.deleteScheduleValidation = exports.scheduleValidation = void 0;
const joi_1 = __importDefault(require("joi"));
exports.scheduleValidation = joi_1.default.object({
    date: joi_1.default.date().required(),
    movieId: joi_1.default.number().required(),
    auditoriumId: joi_1.default.number().required(),
    duration: joi_1.default.number().optional()
});
exports.deleteScheduleValidation = joi_1.default.object({
    id: joi_1.default.number().required(),
});
exports.updateScheduleValidation = joi_1.default.object({
    id: joi_1.default.number().optional(),
    date: joi_1.default.date().optional(),
    movieId: joi_1.default.number().optional(),
    auditoriumId: joi_1.default.number().optional(),
});
exports.listValidation = joi_1.default.object({
    page: joi_1.default.number().min(1).optional(),
    limit: joi_1.default.number().min(1).optional(),
});
