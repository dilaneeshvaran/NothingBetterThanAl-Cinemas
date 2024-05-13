"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listValidation = exports.updateMovieValidation = exports.deleteMovieValidation = exports.movieValidation = void 0;
const joi_1 = __importDefault(require("joi"));
exports.movieValidation = joi_1.default.object({
    title: joi_1.default.string().required(),
    description: joi_1.default.string().required(),
    imageUrl: joi_1.default.string().optional().uri(),
    duration: joi_1.default.number().required(),
});
exports.deleteMovieValidation = joi_1.default.object({
    id: joi_1.default.number().required(),
});
exports.updateMovieValidation = joi_1.default.object({
    id: joi_1.default.number().required(),
    description: joi_1.default.string().optional(),
    imageUrl: joi_1.default.string().optional().uri(),
    duration: joi_1.default.number().optional(),
});
exports.listValidation = joi_1.default.object({
    page: joi_1.default.number().min(1).optional(),
    limit: joi_1.default.number().min(1).optional(),
});
