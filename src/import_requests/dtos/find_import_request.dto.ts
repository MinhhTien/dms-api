import { UUID } from '../../lib/global.type';
import { RequestStatus } from '../../constants/enum';
export class FindImportRequestDto {
  /**
   * Requester id (MANAGER only)
   * @optional
   * @isString
   */
  createdBy?: UUID;

  /**
   * Request status filter
   * @optional
   */
  status?: RequestStatus;

  /**
   * Default 10
   * @isNumber
   * @minimum 1
   * @isInt
   * @default 10
   * @optional
   */
  take?: number;

  /**
   * Default 1
   * @isNumber
   * @minimum 1
   * @isInt
   * @default 1
   * @optional
   */
  page?: number;
}
