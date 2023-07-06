import { UUID } from '../../lib/global.type';
export class UpdateDocumentDto {
  /**
   * @isUUID
   * @isNotEmpty
   */
  id: UUID;

  /**
   * @isString
   * @isNotEmpty
   */
  name: string;

  /**
   * @isString
   * @isNotEmpty
   */
  description: string;

  /**
   * @isUUID
   * @isNotEmpty
   * @isString
   */
  category: {
    id: UUID;
  };
}
