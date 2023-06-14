import * as express from 'express';
import { DecodedIdToken, getAuth } from 'firebase-admin/auth';
import { UsersService } from '../users/users.service';
import { UnauthorizedError, ForbiddenError } from '../constants/response';
import { User } from 'users/entities/user.entity';

let inactivityTimeout: NodeJS.Timeout;
const timeout = 60 * 60 * 1000; // 1 hours

// Function to start the inactivity timeout
const startInactivityTimeout = (timeoutAction: () => Promise<void>) => {
  inactivityTimeout = setTimeout(timeoutAction, timeout);
};

// Function to reset the inactivity timeout
const resetInactivityTimeout = (timeoutAction: () => Promise<void>) => {
  clearTimeout(inactivityTimeout);
  startInactivityTimeout(timeoutAction);
};

// Function to handle user activity
const handleUserActivity = (uid: string) => {
  // Revoke all refresh tokens for a specified user for whatever reason.
  // Retrieve the timestamp of the revocation, in seconds since the epoch.
  const timeoutAction = async () => {
    await getAuth().revokeRefreshTokens(uid);
    const userRecord = await getAuth().getUser(uid);
    const revokedTime = new Date(
      userRecord.tokensValidAfterTime as string
    ).getUTCDate();
    console.log(`Tokens revoked at: ${revokedTime}`);
  };
  resetInactivityTimeout(timeoutAction);
  // Perform additional actions based on user activity
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
        const checkRevoked = true;
        const decodedToken: DecodedIdToken = await getAuth().verifyIdToken(
          token as string,
          checkRevoked
        );
        const user = await new UsersService().get(decodedToken.email as string);
        if (!user) {
          return Promise.reject(new ForbiddenError('Access denied'));
        }
        console.info(user.id, user.email);
        if (!scopes.includes(user?.role?.name)) {
          return Promise.reject(new ForbiddenError('Not permitted'));
        }
        handleUserActivity(decodedToken.uid);
        return user;
      } catch (error: any) {
        // Handle error
        if (error.errorInfo) {
          console.error(error.errorInfo);
          if (error.errorInfo.code === 'auth/id-token-expired') {
            return Promise.reject(new UnauthorizedError('Token expired'));
          }
          if (error.errorInfo.code === 'auth/id-token-revoked') {
            return Promise.reject(new UnauthorizedError('Token revoked'));
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
