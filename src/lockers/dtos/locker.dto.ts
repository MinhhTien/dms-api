import { UUID } from '../../lib/global.type';

export interface CreateLockerDto {
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

  room: {
    /**
     * @isUUID
     * @isNotEmpty
     * @isString
     */
    id: UUID;
  };
}

export interface UpdateLockerDto {
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
