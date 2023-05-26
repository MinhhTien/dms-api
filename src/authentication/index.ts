import * as express from 'express';
import { DecodedIdToken, getAuth } from 'firebase-admin/auth';
import { UsersService } from '../users/users.service';

export class UnauthorizedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

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
        const decodedToken: DecodedIdToken = await getAuth().verifyIdToken(token as string);
        const user = await new UsersService().get(decodedToken.email as string);
        if (!user) {
          return Promise.reject(new UnauthorizedError('Access denied'));
        }
        console.log(user);
          if (!scopes.includes(user.role.name)) {
            return Promise.reject(new UnauthorizedError('Not permitted'));
          }
        return user;
      } catch (error) {
        // Handle error
        console.log(error);
        return Promise.reject(new UnauthorizedError('Invalid token'));
      }
    } else {
      return Promise.reject(new UnauthorizedError('No token provided'));
    }
  }
  return Promise.reject(new UnauthorizedError('No token provided'));
};
