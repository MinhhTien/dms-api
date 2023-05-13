import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import cors from "cors";
import { initialize } from "./database/initiation";

dotenv.config();

const app: Express = express();
const port = process.env.PORT;

const corsOptions = {
  origin: "*",
};

app.use(cors(corsOptions));

initialize();

app.get("/", (req: Request, res: Response) => {
  res.send("Express + TypeScript Server");
});

app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});
