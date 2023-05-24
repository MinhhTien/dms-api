import { getAuth } from 'firebase-admin/auth';

export const authenticate = (token: string): string => {
  let message = '';
  getAuth()
    .verifyIdToken(token)
    .then((decodedToken) => {
      console.log(decodedToken);
      message = 'Authenticated';
    })
    .catch((error) => {
      // Handle error
      console.log(error);
      message = 'Unauthenticated';
    });
  return message;
};
