import { getAuth } from 'firebase-admin/auth';
import { UsersService } from '../users/users.service';
import cron from 'node-cron';
import { BorrowRequestService } from '../borrow_requests/borrow_request.service';
import { ImportRequestService } from '../import_requests/import_request.service';
import { DocumentService } from '../documents/document.service';
import { DocumentStatus, NotificationType } from '../constants/enum';
import { sendToManagerTopic } from './notification';

export const updatePhotoURL = () => {
  const userService = new UsersService();
  cron.schedule('59 23 * * *', async () => {
    console.debug('---------------------');
    console.debug('Time: ', new Date());
    console.debug('Running UpdatePhotoURL Cron Job');
    const users = await userService.getAll();
    users?.forEach(async (user) => {
      const userRecord = await getAuth().getUserByEmail(user.email);
      await userService.update(user.id, {
        photoURL: userRecord.photoURL,
      });
    });
    console.debug('Completed UpdatePhotoURL Cron Job');
    console.debug('---------------------');
  });
};

export const updateExpiredRequest = () => {
  const borrowRequestService = new BorrowRequestService();
  const importRequestService = new ImportRequestService();
  cron.schedule('59 23 * * *', async () => {
    console.debug('---------------------');
    console.debug('Time: ', new Date());
    console.debug('Running UpdateExpiredRequest Cron Job');
    await Promise.all([
      borrowRequestService.updateExpired(),
      importRequestService.updateExpired(),
    ]);
    console.debug('Completed UpdateExpiredRequest Cron Job');
    console.debug('---------------------');
  });
};

// send notification to manager topic about number of pending document in 4h30pm
export const sendNotiAboutNumOfPendingDocument = () => {
  const documentService = new DocumentService();
  cron.schedule('20 * * * *', async () => {
    console.debug('---------------------');
    console.debug('Time: ', new Date());
    console.debug('Running SendNotiAboutNumOfPendingDocument Cron Job');
    const pendingDocumentCount = await documentService.count([DocumentStatus.PENDING]);
    
    await sendToManagerTopic(
      NotificationType.PENDING,
      `There are ${pendingDocumentCount} pending documents.`,
      `Please confirm them located in correct place as soon as possible.`
    );

    console.debug('Completed SendNotiAboutNumOfPendingDocument Cron Job');
    console.debug('---------------------');
  });
};