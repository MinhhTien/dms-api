import path from "path";
import { DataSource } from "typeorm";

import dotenv from "dotenv"
dotenv.config();

const { DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_NAME } = process.env;

export const AppDataSource = new DataSource({
  type: "postgres",
  host: DB_HOST || "localhost",
  port: DB_PORT ? Number.parseInt(DB_PORT) : 3306,
  username: DB_USERNAME || "root",
  password: DB_PASSWORD || "12345",
  database: DB_NAME || "test",
  synchronize: true,
  logging: ['error', 'warn', 'log'],
  entities: [path.resolve(__dirname + '/../**/*.entity{.js,.ts}')],
  migrations: [path.resolve(__dirname + '/../migrations', '*{.js,.ts}')],
  cache: true,
});
