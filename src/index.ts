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
import { multerUpload } from './lib/upload';
import { MulterError } from 'multer';
import { createClient } from 'redis';
import { RedisClientType } from '@redis/client';
import { updatePhotoURL } from './lib/cron';

dotenv.config();

initializeApp({
  credential: cert(serviceAccount as ServiceAccount),
});

const app: Express = express();
const port = parseInt(process.env.PORT || '8000');
const redisClient: RedisClientType = createClient({
  username: process.env.REDIS_USERNAME || 'default',
  password: process.env.REDIS_PASSWORD || '',
  socket: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
});

const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*',
};

app.use(cors(corsOptions));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(
  '/static',
  (req: Request, res: Response, next: NextFunction) => {
    throw new ForbiddenError('Not implemented');
  },
  express.static('uploads')
);

app.post('/documents/upload/:id', multerUpload.single('file'));

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
    if (err instanceof MulterError) {
      console.error(`Caught Error for ${req.path}:`, err);
      if (err.code === 'LIMIT_FILE_SIZE')
        return res.status(400).json({
          message: err.message,
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

app.listen(port, async () => {
  redisClient.on('error', (error) =>
    console.error(`Error from redis : ${error}`)
  );

  await redisClient.connect();
  updatePhotoURL();

  console.log(`🔥[cache]: Redis is connected`);
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});

export { redisClient };
