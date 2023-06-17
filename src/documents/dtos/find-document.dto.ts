import { UUID } from '../../lib/global.type';
export class FindDocumentDto {
  /**
   * @isString
   * @optional
   */
  keyword?: string;

  /**
   * @isNumber
   * @minimum 1
   * @isInt
   * @default 10
   * @optional
   */
  take?: number;

  /**
   * @isNumber
   * @minimum 1
   * @isInt
   * @default 1
   * @optional
   */
  page?: number;

  /**
   * @isUUID
   * @isString
   * @optional
   */
  folderId?: UUID;
}
