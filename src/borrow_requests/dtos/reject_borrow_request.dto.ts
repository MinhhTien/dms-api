import { UUID } from '../../lib/global.type';
export class RejectBorrowRequestDto {
  /**
   * @isUUID
   * @isNotEmpty
   * @isString
   */
  id: UUID;
  /**
   * @isString
   * @isNotEmpty
   */
  rejectedReason: string;
}
