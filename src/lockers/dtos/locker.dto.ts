import { UUID } from '../../type/global';

export interface CreateLockerDto {
  /**
   * @isString
   */
  name: string;

  /**
   * @isNumber
   * @minimum 1
   * @isInt
   */
  capacity: number;

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
  id: UUID

  /**
   * @isString
   */
  name: string;

  /**
   * @isNumber
   * @minimum 1
   * @isInt
   */
  capacity: number;
}
