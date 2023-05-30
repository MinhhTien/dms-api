import { UUID } from '../../type/global';

export interface CreateRoomDto {
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

  department: {
    /**
     * @isUUID
     * @isNotEmpty
     * @isString
     */
    id: UUID;
  };
}

export interface UpdateRoomDto {
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
