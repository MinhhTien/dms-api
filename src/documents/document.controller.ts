import { CreateDocumentDto } from './dtos/create-document.dto';
import {
  Route,
  Post,
  Response,
  Controller,
  UploadedFile,
  Tags,
  Security,
  Request,
  Body,
  Path,
  Get,
  Query,
} from 'tsoa';
import { BadRequestError, SuccessResponse } from '../constants/response';
import { injectable } from 'tsyringe';
import { DocumentService } from './document.service';
import { Document } from './entities/document.entity';
import { UUID } from '../lib/global.type';
import fs from 'fs';
import { base64toUUID, uuidToBase64 } from '../lib/barcode';

@injectable()
@Tags('Document')
@Route('documents')
export class DocumentController extends Controller {
  constructor(private documentService: DocumentService) {
    super();
  }

  /**
   * Retrieves a document.
   * If user is EMPLOYEE, only get document in own department.
   * @param id The id of document
   */
  @Security('api_key', ['STAFF', 'EMPLOYEE'])
  @Get('/:id')
  @Response<Document>(200)
  @Response<BadRequestError>(400)
  public async getOne(@Path() id: UUID, @Request() request: any) {
    const result = await this.documentService.getOne(
      id,
      request.user.role === 'EMPLOYEE' ? request.user.departmentId : undefined // if user is employee, only get folder of his department
    );
    if (result !== null) return new SuccessResponse('Success', result);
    else throw new BadRequestError('Document not existed.');
  }

  /**
   * Retrieves document barcode.(STAFF only)
   * @param id The id of document
   */
  @Security('api_key', ['STAFF'])
  @Get('/barcode/:id')
  @Response<Document>(200)
  @Response<BadRequestError>(400)
  public async getBarcode(@Path() id: UUID, @Request() request: any) {
    const result = await this.documentService.getOne(id);
    if (result !== null)
      return new SuccessResponse('Success', {
        ...result,
        barcode: uuidToBase64(result.id),
      });
    else throw new BadRequestError('Document not existed.');
  }

  /**
   * Retrieves documents of folder.
   * If user is EMPLOYEE, only get documents of folder in own department.
   * @param documentId The id of document
   */
  @Security('api_key', ['STAFF', 'EMPLOYEE'])
  @Get('')
  @Response<Document[]>(200)
  public async getMany(@Request() request: any, @Query() folderId: UUID) {
    return new SuccessResponse(
      'Success',
      await this.documentService.getMany(
        folderId,
        request.user.role === 'EMPLOYEE' ? request.user.departmentId : undefined
      )
    );
  }

  /**
   * Create new document (STAFF only)
   */
  @Post('')
  @Security('api_key', ['STAFF'])
  @Response<SuccessResponse>(200)
  public async create(
    @Request() request: any,
    @Body() createDocumentDto: CreateDocumentDto
  ): Promise<any> {
    const result = await this.documentService.create(
      createDocumentDto,
      request.user
    );
    if (result instanceof Document)
      return new SuccessResponse('Success', {
        id: result.id,
        barcode: uuidToBase64(result.id),
      });
    if (result == null) throw new BadRequestError('Failed to create document.');
    else throw new BadRequestError(result);
  }

  /**
   * Upload pdf file for document (STAFF only)
   */
  @Post('upload/:id')
  @Security('api_key', ['STAFF'])
  @Response<SuccessResponse>(200)
  public async upload(
    @Request() request: any,
    @Path() id: UUID,
    @UploadedFile() file: Express.Multer.File
  ): Promise<any> {
    console.log(file);
    const document = await this.documentService.getOne(
      id,
      request.user.departmentId
    );
    if (document == null) {
      fs.unlink(__dirname + '/../../uploads/' + file.filename, (err) => {
        if (err) console.log(err);
      });
      throw new BadRequestError('Document not existed.');
    } else {
      if (document.storageUrl != null) {
        fs.unlink(
          __dirname + '/../../uploads/' + document.storageUrl,
          (err) => {
            if (err) console.log(err);
          }
        );
      }
    }

    const result = await this.documentService.update(
      document.id,
      file.filename,
      request.user
    );
    if (result) return new SuccessResponse('Success', result);
    else throw new BadRequestError('Failed to upload file of document.');
  }

  /**
   * After scan location of document. Confirm document is located in correct place (STAFF only)
   */
  @Post('confirm/:id')
  @Security('api_key', ['STAFF'])
  @Response<SuccessResponse>(200)
  public async confirm(
    @Request() request: any,
    @Path() id: UUID,
    @Body() locationQRcode: string
  ): Promise<any> {
    console.log(base64toUUID(locationQRcode));
    const folderId = base64toUUID(locationQRcode);

    const result = await this.documentService.confirm(
      id,
      folderId,
      request.user
    );

    if (result) return new SuccessResponse('Success', result);
    else
      throw new BadRequestError(
        'Failed to confirm document is placed in correct place.'
      );
  }
}
