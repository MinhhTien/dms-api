import { UUID } from '../../lib/global.type';

export class CreateDocumentDto {
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
  folder: {
    id: UUID;
  };
}
