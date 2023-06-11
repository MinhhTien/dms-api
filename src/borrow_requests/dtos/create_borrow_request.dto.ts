import { UUID } from '../../lib/global.type';
export class CreateBorrowRequestDto {
  /**
   * @isUUID
   * @isNotEmpty
   * @isString
   */
  document: {
    id: UUID;
  };
  /**
   * @isString
   * @isNotEmpty
   */
  description: string;

  /**
   * @isDate
   * @isNotEmpty
   */
  startDate: Date;

  /**
   * @isNumber
   * @default 1
   * @minimum 1
   * @maximum 30
   * @isInt
   */
  borrowDuration: number;
}
