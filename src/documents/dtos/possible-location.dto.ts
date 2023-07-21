import { UUID } from '../../lib/global.type';
export class PossibleLocationDto {
  /**
   * @isNumber
   * @minimum 1
   * @isInt
   * @default 10
   */
  numOfPages: number;

  /**
   * @isUUID
   * @isNotEmpty
   * @isString
   */
  departmentId: UUID;
}
