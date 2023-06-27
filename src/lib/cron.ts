import { getAuth } from 'firebase-admin/auth';
import { UsersService } from '../users/users.service';
import cron from 'node-cron';

export const updatePhotoURL = () => {
  const userService = new UsersService();
  cron.schedule('59 23 * * *', async () => {
    console.debug('---------------------');
    console.debug('Running Cron Job');
    const users = await userService.getAll();
    users?.forEach(async (user) => {
      const userRecord = await getAuth().getUserByEmail(user.email);
      await userService.update(user.id, {
        photoURL: userRecord.photoURL,
      });
    });
    console.debug('Completed Cron Job');
    console.debug('---------------------');
  });
};
