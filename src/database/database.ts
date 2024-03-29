import { DataSource } from "typeorm";

export const AppDataSource = new DataSource({
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
