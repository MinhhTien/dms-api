import { UUID } from '../../lib/global.type';
export class FindDocumentDto {
  /**
   * @isString
   * @optional
   */
  keyword?: string;

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

  /**
   * @isUUID
   * @isString
   * @optional
   */
  folderId?: UUID;

  /**
   * @isNumber
   * @minimum 0
   * @maximum 1
   * @isInt
   * @default 1
   * @optional
   */
  sortName?: number;

  /**
   * @isNumber
   * @minimum 0
   * @maximum 1
   * @isInt
   * @default 0
   * @optional
   */
  skipPagination?: number;
}
