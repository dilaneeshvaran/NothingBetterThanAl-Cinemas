"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Auditorium = void 0;
const typeorm_1 = require("typeorm");
const class_validator_1 = require("class-validator");
let Auditorium = class Auditorium {
    constructor(name, description, imageUrl, type, capacity, handicapAccessible, maintenance) {
        this.name = name;
        this.description = description;
        this.imageUrl = imageUrl;
        this.type = type;
        this.capacity = capacity;
        this.handicapAccessible = handicapAccessible;
        this.maintenance = maintenance;
    }
};
exports.Auditorium = Auditorium;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Auditorium.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true }),
    __metadata("design:type", String)
], Auditorium.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Auditorium.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Auditorium.prototype, "imageUrl", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Auditorium.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    (0, class_validator_1.Min)(15),
    (0, class_validator_1.Max)(30),
    __metadata("design:type", Number)
], Auditorium.prototype, "capacity", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "boolean", default: false }),
    __metadata("design:type", Boolean)
], Auditorium.prototype, "maintenance", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Boolean)
], Auditorium.prototype, "handicapAccessible", void 0);
exports.Auditorium = Auditorium = __decorate([
    (0, typeorm_1.Entity)(),
    __metadata("design:paramtypes", [String, String, String, String, Number, Boolean, Boolean])
], Auditorium);
