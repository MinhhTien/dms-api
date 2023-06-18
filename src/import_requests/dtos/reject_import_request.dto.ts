import { UUID } from '../../lib/global.type';
export class RejectImportRequestDto {
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
