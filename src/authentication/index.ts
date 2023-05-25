import * as express from 'express';
import * as jwt from 'jsonwebtoken';
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

  if (securityName === 'jwt') {
    const token =
      request.body.token ||
      request.query.token ||
      request.headers['x-access-token'];

    return new Promise((resolve, reject) => {
      if (!token) {
        reject(new Error('No token provided'));
      }
      jwt.verify(token, '[secret]', function (err: any, decoded: any) {
        if (err) {
          reject(err);
        } else {
          // Check if JWT contains all required scopes
          for (let scope of scopes) {
            if (!decoded.scopes.includes(scope)) {
              reject(new Error('JWT does not contain required scope.'));
            }
          }
          resolve(decoded);
        }
      });
    });
  }
  return Promise.reject(new UnauthorizedError('No token provided'));
};
