import { initializeApp, cert, ServiceAccount } from 'firebase-admin/app';
import express, { Express, Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import bodyParser from 'body-parser';
import { initialize } from './database/initiation';
import { RegisterRoutes } from './routes';
import * as swaggerUI from 'swagger-ui-express';
import { ValidateError } from 'tsoa';
import {
  UnauthorizedError,
  ForbiddenError,
  BadRequestError,
} from './constants/response';

import serviceAccount from '../dms-firebase-adminsdk-service-account.json';

dotenv.config();

initializeApp({
  credential: cert(serviceAccount as ServiceAccount),
});

const app: Express = express();
const port = process.env.PORT || 8000;

const corsOptions = {
  origin: '*',
};

app.use(cors(corsOptions));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

initialize();
RegisterRoutes(app);

// Error handler
app.use(
  (
    err: unknown,
    req: Request,
    res: Response,
    next: NextFunction
  ): Response | void => {
    if (err instanceof ValidateError) {
      console.warn(`Caught Validation Error for ${req.path}:`, err.fields);
      return res.status(422).json({
        message: 'Validation Failed',
        details: err?.fields,
      });
    }
    if (err instanceof UnauthorizedError) {
      console.warn(`Caught Unauthorized Error for ${req.path}:`, err.message);
      return res.status(401).json({
        message: 'Unauthorized',
        details: err?.message,
      });
    }
    if (err instanceof BadRequestError) {
      console.warn(`Caught Bad Request Error for ${req.path}:`, err.message);
      return res.status(400).json({
        message: 'Bad Request',
        details: err?.message,
      });
    }
    if (err instanceof ForbiddenError) {
      console.warn(`Caught Forbidden Error for ${req.path}:`, err.message);
      return res.status(403).json({
        message: 'Forbidden',
        details: err?.message,
      });
    }
    if (err instanceof Error) {
      console.error(`Caught Error for ${req.path}:`, err);
      return res.status(500).json({
        message: 'Internal Server Error',
      });
    }
    next();
  }
);

app.use('/docs', swaggerUI.serve, async (req: Request, res: Response) => {
  return res.send(swaggerUI.generateHTML(await import('./swagger.json')));
});

app.get('/', (req: Request, res: Response) => {
  res.send('Express + TypeScript Server');
});

// Not found handler
app.use((req, res: Response) => {
  res.status(404).send({
    message: 'Not Found',
  });
});

app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});
