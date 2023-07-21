import { UUID } from '../../lib/global.type';
export class MoveDocumentDto {
  /**
   * @isUUID
   * @isNotEmpty
   */
  id: UUID;

  /**
   * @isUUID
   * @isNotEmpty
   * @isString
   */
  folderId: UUID
}
