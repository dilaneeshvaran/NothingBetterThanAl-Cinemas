"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = void 0;
const typeorm_1 = require("typeorm");
exports.AppDataSource = new typeorm_1.DataSource({
    type: "mysql",
    host: "localhost",
    port: 3306,
    username: "admin",
    password: "admin",
    database: "nbta-cinemas",
    logging: true,
    synchronize: true,
    entities: ["src/database/entities/*.ts"],
    migrations: ["src/database/migrations/*.ts"],
});
