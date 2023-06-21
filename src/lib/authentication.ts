import * as express from 'express';
import { DecodedIdToken, getAuth } from 'firebase-admin/auth';
import { UsersService } from '../users/users.service';
import { UnauthorizedError, ForbiddenError } from '../constants/response';
import { User } from 'users/entities/user.entity';

const userSessions: Map<string, number> = new Map();
const timeout = 60 * 60 * 1000; // 1 hours

const createUserSession = (uid: string) => {
  userSessions.set(uid, Date.now() + timeout);
};

export const expressAuthentication = async (
  request: express.Request,
  securityName: string,
  scopes: string[]
): Promise<User> => {
  if (securityName === 'api_key') {
    let token;
    if (request.headers['authentication']) {
      token = request.headers['authentication'];
    }

    if (token) {
      try {
        const decodedToken: DecodedIdToken = await getAuth().verifyIdToken(
          token as string
        );
        const user = await new UsersService().get(decodedToken.email as string);
        if (!user) {
          return Promise.reject(new ForbiddenError('Access denied'));
        }
        console.info(user.id, user.email);
        if (!scopes.includes(user?.role?.name)) {
          return Promise.reject(new ForbiddenError('Not permitted'));
        }
        if (
          request.path !== '/users/login' &&
          (!userSessions.has(decodedToken.uid) ||
            (userSessions.get(decodedToken.uid) as number) < Date.now())
        ) {
          return Promise.reject(new UnauthorizedError('Session expired'));
        }
        createUserSession(decodedToken.uid);
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
