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
const express_1 = __importDefault(require("express"));
const auditorium_routes_1 = require("./handlers/routes/auditorium-routes");
const ticket_routes_1 = require("./handlers/routes/ticket-routes");
const schedule_routes_1 = require("./handlers/routes/schedule-routes");
const movie_routes_1 = require("./handlers/routes/movie-routes");
const super_ticket_routes_1 = require("./handlers/routes/super-ticket-routes");
const user_routes_1 = require("./handlers/routes/user-routes");
const transaction_routes_1 = require("./handlers/routes/transaction-routes");
const database_1 = require("./database/database");
const { swaggerUi, specs } = require('./swagger');
const main = () => __awaiter(void 0, void 0, void 0, function* () {
    const app = (0, express_1.default)();
    const port = process.env.PORT || 8080;
    try {
        yield database_1.AppDataSource.initialize();
        console.error("well connected to database");
    }
    catch (error) {
        console.log(error);
        console.error("Cannot contact database");
        process.exit(1);
    }
    app.use(express_1.default.json());
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
    (0, auditorium_routes_1.initAuditoriumRoutes)(app);
    (0, ticket_routes_1.initTicketRoutes)(app);
    (0, schedule_routes_1.initScheduleRoutes)(app);
    (0, movie_routes_1.initMovieRoutes)(app);
    (0, super_ticket_routes_1.initSuperTicketRoutes)(app);
    (0, user_routes_1.initUserRoutes)(app);
    (0, transaction_routes_1.initTransactionRoutes)(app);
    app.listen(port, () => {
        console.log(`Server running on port ${port}`);
    });
});
main();
