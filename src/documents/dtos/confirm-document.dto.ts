import { UUID } from '../../lib/global.type';

export class ConfirmDocumentDto {
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
  locationQRcode: string;
}
