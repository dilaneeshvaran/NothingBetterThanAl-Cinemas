import express from "express";
import { initAuditoriumRoutes} from "./handlers/routes/auditorium-routes";
import { initTicketRoutes } from "./handlers/routes/ticket-routes";
import { initScheduleRoutes } from "./handlers/routes/schedule-routes";
import { initMovieRoutes } from "./handlers/routes/movie-routes";
import { initSuperTicketRoutes } from "./handlers/routes/super-ticket-routes";
import {initUserRoutes } from "./handlers/routes/user-routes";
import { initTransactionRoutes } from "./handlers/routes/transaction-routes";
import { AppDataSource } from "./database/database";

const { swaggerUi, specs } = require('./swagger');

const main = async () => {
  const app = express();
  //const port = process.env.PORT || 8080;
  const port = 3000;

  try {
    await AppDataSource.initialize();
    console.error("well connected to database");
  } catch (error) {
    console.log(error);
    console.error("Cannot contact database");
    process.exit(1);
  }

  
  app.use(express.json());
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
  
  initAuditoriumRoutes(app);
  initTicketRoutes(app);
  initScheduleRoutes(app);
  initMovieRoutes(app);
  initSuperTicketRoutes(app);
  initUserRoutes(app);
  initTransactionRoutes(app);
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
};

main();