import { CreateDocumentDto } from '../../documents/dtos/create-document.dto';
export class CreateImportRequestDto {
  /**
   * @isNotEmpty
   */
  document: CreateDocumentDto;
  /**
   * @isString
   * @isNotEmpty
   */
  description: string;
}
