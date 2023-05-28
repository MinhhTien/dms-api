import * as express from 'express';
import { DecodedIdToken, getAuth } from 'firebase-admin/auth';
import { UsersService } from '../users/users.service';
import { UnauthorizedError, ForbiddenError } from '../constants/response';

export const expressAuthentication = async (
  request: express.Request,
  securityName: string,
  scopes: string[]
): Promise<any> => {
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
        console.info(user);
        if (!scopes.includes(user?.role?.name)) {
          return Promise.reject(new ForbiddenError('Not permitted'));
        }
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