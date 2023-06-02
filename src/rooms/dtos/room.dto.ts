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
   * @default 10
   */
  capacity?: number;

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
   * @default 10
   */
  capacity: number;
}
