import * as express from 'express';
import { DecodedIdToken, getAuth } from 'firebase-admin/auth';
import { UsersService } from '../users/users.service';
import { UnauthorizedError, ForbiddenError } from '../constants/response';
import { User } from '../users/entities/user.entity';
import { redisClient } from '../index';

const timeout = parseInt(process.env.TIMEOUT || '60') * 60;

export const expressAuthentication = async (
  request: express.Request,
  securityName: string,
  scopes: string[]
) => {
  if (securityName === 'api_key') {
    let token;
    if (request.headers['authentication']) {
      token = request.headers['authentication'];
    }

    if (token) {
      try {
        const decodedToken: DecodedIdToken = await getAuth().verifyIdToken(
          token as string,
          true
        );
        const cachedUser = await redisClient.get(decodedToken.uid);

        if (request.path !== '/users/login' && cachedUser == null) {
          return Promise.reject(new UnauthorizedError('Session expired'));
        }

        const user: User = cachedUser
          ? JSON.parse(cachedUser)
          : await new UsersService().get(decodedToken.email as string);
        if (!user) {
          return Promise.reject(new ForbiddenError('Access denied'));
        }
        console.info(user.id, user.email);
        if (!scopes.includes(user?.role?.name)) {
          return Promise.reject(new ForbiddenError('Not permitted'));
        }

        await redisClient.set(decodedToken.uid, JSON.stringify(user), {
          EX: timeout,
        });

        return user;
      } catch (error: any) {
        // Handle error
        if (error.errorInfo) {
          console.error(error.errorInfo);
          if (error.errorInfo.code === 'auth/id-token-expired') {
            return Promise.reject(new UnauthorizedError('Token expired'));
          }
        }
        return Promise.reject(new UnauthorizedError('Invalid token'));
      }
    } else {
      return Promise.reject(new UnauthorizedError('No token provided'));
    }
  }
  return Promise.reject(new UnauthorizedError('Authentication not supported'));
};
