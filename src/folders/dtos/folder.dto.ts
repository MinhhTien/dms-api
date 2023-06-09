import { UUID } from '../../lib/global.type';

export interface CreateFolderDto {
  /**
   * @isString
   */
  name: string;

  /**
   * @isNumber
   * @minimum 1
   * @isInt
   * @default 10
   */
  capacity?: number;

  locker: {
    /**
     * @isUUID
     * @isNotEmpty
     * @isString
     */
    id: UUID;
  };
}

export interface UpdateFolderDto {
  /**
   * @isUUID
   */
  id: UUID;

  /**
   * @isString
   */
  name: string;

  /**
   * @isNumber
   * @minimum 1
   * @isInt
   * @default 10
   */
  capacity: number;
}
