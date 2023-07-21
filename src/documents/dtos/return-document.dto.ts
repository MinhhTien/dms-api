export class ReturnDocumentDto {
  /**
   * @isString
   * @isNotEmpty
   */
  QRCode: string;

  /**
   * @isString
   * @isOptional
   */
  note?: string;
}
