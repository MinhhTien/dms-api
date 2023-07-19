import { Novu } from '@novu/node';
import { TriggerRecipientsTypeEnum } from '@novu/shared';
import { NotificationType } from '../constants/enum';
const novuImportTemplateId = process.env.NOVU_IMPORT_TEMPLATE_ID || '';
const novuBorrowTemplateId = process.env.NOVU_BORROW_TEMPLATE_ID || '';
const novuPendingTemplateId = process.env.NOVU_PENDING_TEMPLATE_ID || '';
const novuImportTopicKey = 'manager-import-request';
const novuBorrowTopicKey = 'manager-borrow-request';
const novuPendingTopicKey = 'manager-pending-request';

export const novu = new Novu(process.env.NOVU_API_KEY || '');

export const sendToSubscriber = async (
  type: NotificationType,
  subscriberId: string,
  userName: string,
  action: string
) => {
  console.log(`⚡: Send ${type.toLowerCase()} notification to ${userName}!`);
  try {
    let novuTemplateId;
    switch (type) {
      case NotificationType.IMPORT:
        novuTemplateId = novuImportTemplateId;
        break;
      case NotificationType.BORROW:
        novuTemplateId = novuBorrowTemplateId;
        break;
      case NotificationType.PENDING:
        novuTemplateId = novuPendingTemplateId;
        break;
      default:
        throw new Error('Invalid notification type');
    }

    const result = await novu.trigger(novuTemplateId, {
      to: {
        subscriberId: subscriberId,
      },
      payload: {
        userName,
        action,
      },
    });
    console.log(result.data);
  } catch (err) {
    console.error('Error >>>>', { err });
  }
};

export const sendToManagerTopic = async (
  type: NotificationType,
  userName: string,
  action: string
) => {
  console.log(`⚡: Send ${type.toLowerCase()} notification to manager topic!`);
  try {
    let novuTemplateId;
    let novuTopicKey;
    switch (type) {
      case NotificationType.IMPORT:
        novuTemplateId = novuImportTemplateId;
        novuTopicKey = novuImportTopicKey;
        break;
      case NotificationType.BORROW:
        novuTemplateId = novuBorrowTemplateId;
        novuTopicKey = novuBorrowTopicKey;
        break;
      case NotificationType.PENDING:
        novuTemplateId = novuPendingTemplateId;
        novuTopicKey = novuPendingTopicKey;
        break;
      default:
        throw new Error('Invalid notification type');
    }

    const result = await novu.trigger(novuTemplateId, {
      to: [{ type: TriggerRecipientsTypeEnum.TOPIC, topicKey: novuTopicKey }],
      payload: {
        userName,
        action,
      },
    });
    console.log(result.data);
  } catch (err) {
    console.error('Error >>>>', { err });
  }
};
