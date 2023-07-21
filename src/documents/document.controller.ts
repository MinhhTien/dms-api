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
  Queries,
  Produces,
  Put,
  Delete,
} from 'tsoa';
import { BadRequestError, SuccessResponse } from '../constants/response';
import { injectable } from 'tsyringe';
import { DocumentService } from './document.service';
import { Document } from './entities/document.entity';
import { UUID } from '../lib/global.type';
import fs from 'fs';
import { base64toUUID, uuidToBase64 } from '../lib/barcode';
import { ConfirmDocumentDto } from './dtos/confirm-document.dto';
import { DocumentStatus } from '../constants/enum';
import { FindDocumentDto } from './dtos/find-document.dto';
import { resolve } from 'path';
import { UpdateDocumentDto } from './dtos/update-document.dto';
import { VerifyReturnDocumentDto } from './dtos/verify-return-document.dto';
import { convertFirstPage, convertAll } from '../lib/file';
import { ReturnDocumentDto } from './dtos/return-document.dto';

@injectable()
@Tags('Document')
@Route('documents')
export class DocumentController extends Controller {
  constructor(private documentService: DocumentService) {
    super();
  }

  /**
   * Retrieves document barcode.(MANAGER only)
   * @param id The id of document
   */
  @Security('api_key', ['MANAGER'])
  @Get('/barcode/:id')
  @Response<Document>(200)
  @Response<BadRequestError>(400)
  public async getBarcode(@Path() id: UUID, @Request() request: any) {
    const result = await this.documentService.getOne(id, [
      DocumentStatus.PENDING,
      DocumentStatus.AVAILABLE,
      DocumentStatus.BORROWED,
    ]);
    if (result !== null)
      return new SuccessResponse('Success', {
        ...result,
        barcode: uuidToBase64(result.id),
      });
    else throw new BadRequestError('Document not existed.');
  }

  /**
   * Retrieves stored documents. (AVAILABLE and BORROWED status)
   * If user is EMPLOYEE, only get stored documents of folder in own department.
   * @param folderId The id of folder (optional)
   */
  @Security('api_key', ['MANAGER', 'EMPLOYEE'])
  @Get('')
  @Response<Document[]>(200)
  public async getMany(
    @Request() request: any,
    @Queries() dto: FindDocumentDto
  ) {
    return new SuccessResponse(
      'Success',
      await this.documentService.getMany(
        [DocumentStatus.AVAILABLE, DocumentStatus.BORROWED],
        dto,
        request.user.role.name === 'EMPLOYEE'
          ? request.user.department.id
          : undefined
      )
    );
  }

  /**
   * Count documents.
   * If user is EMPLOYEE, only count documents in own department.
   */
  @Security('api_key', ['MANAGER', 'EMPLOYEE'])
  @Get('count')
  @Response<number>(200)
  public async count(@Request() request: any) {
    return new SuccessResponse(
      'Success',
      await this.documentService.count(
        [DocumentStatus.AVAILABLE, DocumentStatus.BORROWED],
        request.user.role.name === 'EMPLOYEE'
          ? request.user.department.id
          : undefined
      )
    );
  }

  /**
   * Retrieves pending documents waiting for confirmation. (PENDING status) (MANAGER only)
   * @param folderId The id of folder (optional)
   */
  @Security('api_key', ['MANAGER'])
  @Get('pending')
  @Response<Document[]>(200)
  public async getManyPending(@Queries() dto: FindDocumentDto) {
    return new SuccessResponse(
      'Success',
      await this.documentService.getMany(
        [DocumentStatus.PENDING],
        dto,
        dto.departmentId ? dto.departmentId : undefined,
        true
      )
    );
  }

  /**
   * Retrieves a document.
   * If user is EMPLOYEE, only get document in own department.
   * @param id The id of document
   */
  @Security('api_key', ['MANAGER', 'EMPLOYEE'])
  @Get('/:id')
  @Response<Document>(200)
  @Response<BadRequestError>(400)
  public async getOne(@Path() id: UUID, @Request() request: any) {
    const result =
      request.user.role.name === 'EMPLOYEE'
        ? await this.documentService.getOne(
            id,
            [DocumentStatus.AVAILABLE, DocumentStatus.BORROWED],
            undefined,
            request.user.department.id
          )
        : await this.documentService.getOne(id, [
            DocumentStatus.AVAILABLE,
            DocumentStatus.BORROWED,
            DocumentStatus.PENDING,
            DocumentStatus.REQUESTING,
          ]);

    if (result !== null) return new SuccessResponse('Success', result);
    else throw new BadRequestError('Document not existed.');
  }

  /**
   * Create new document (MANAGER only)
   */
  @Post('')
  @Security('api_key', ['MANAGER'])
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
   * Update document (MANAGER only)
   */
  @Put('')
  @Security('api_key', ['MANAGER'])
  @Response<SuccessResponse>(200)
  public async update(
    @Request() request: any,
    @Body() updateDocumentDto: UpdateDocumentDto
  ): Promise<any> {
    const result = await this.documentService.update(
      updateDocumentDto,
      request.user
    );
    if (result === true) {
      return new SuccessResponse('Document was updated successfully.', result);
    }
    if (result === false)
      throw new BadRequestError('Document could not be updated.');
    else throw new BadRequestError(result);
  }

  /**
   * Upload pdf file for document
   * if employee, only upload file for pending document of own import request
   */
  @Post('upload/:id')
  @Security('api_key', ['MANAGER', 'EMPLOYEE'])
  @Response<SuccessResponse>(200)
  public async upload(
    @Request() request: any,
    @Path() id: UUID,
    @UploadedFile() file: Express.Multer.File
  ): Promise<any> {
    console.log(file);
    const document =
      request.user.role.name === 'EMPLOYEE'
        ? await this.documentService.getOne(
            id,
            [DocumentStatus.REQUESTING],
            request.user,
            request.user.department.id,
            true
          )
        : await this.documentService.getOne(
            id,
            [
              DocumentStatus.AVAILABLE,
              DocumentStatus.BORROWED,
              DocumentStatus.PENDING,
            ],
            undefined,
            undefined,
            true
          );
    if (document == null) {
      fs.unlink('uploads/' + file.filename, (err) => {
        if (err) console.log(err);
      });
      throw new BadRequestError('Document not existed.');
    } else {
      if (document.storageUrl != null) {
        fs.unlink('uploads/' + document.storageUrl, (err) => {
          if (err) console.log(err);
        });
      }
    }

    const result = await this.documentService.updateStorageUrl(
      document.id,
      file.filename,
      request.user
    );

    if (result) {
      // convert pdf to png for scan
      convertAll(file.filename);

      return new SuccessResponse('Success', result);
    } else throw new BadRequestError('Failed to upload file of document.');
  }

  /**
   * Check duplicate pdf file of document
   * If employee, only check file for document of own department
   */
  @Post('duplicate')
  @Security('api_key', ['MANAGER', 'EMPLOYEE'])
  @Response<SuccessResponse>(200)
  public async checkDuplicate(
    @Request() request: any,
    @UploadedFile() file: Express.Multer.File
  ) {
    console.log(file);
    await convertFirstPage(file.filename);
    const duplicatePercent = await this.documentService.checkDuplicatePercent(
      file.filename,
      request.user.role.name === 'EMPLOYEE'
        ? request.user.department.id
        : undefined
    );
    fs.unlink('uploads/' + file.filename, (err) => {
      if (err) console.log(err);
    });
    fs.unlink('temp/' + `${file.filename.split('.')[0]}.png`, (err) => {
      if (err) console.log(err);
    });
    if (duplicatePercent === null) {
      throw new BadRequestError('Some thing went wrong. Please try again.');
    }
    if (duplicatePercent.duplicatePercent <= 0.9)
      return new SuccessResponse('Success', duplicatePercent);
    else return new SuccessResponse('Warning', duplicatePercent);
  }

  /**
   * After scan location of document. Confirm document is located in correct place (MANAGER only)
   */
  @Post('confirm')
  @Security('api_key', ['MANAGER'])
  @Response<SuccessResponse>(200)
  public async confirm(
    @Request() request: any,
    @Body() confirmDocumentDto: ConfirmDocumentDto
  ): Promise<any> {
    console.log(base64toUUID(confirmDocumentDto.locationQRcode));
    const folderId = base64toUUID(confirmDocumentDto.locationQRcode);

    const document = await this.documentService.getOne(confirmDocumentDto.id, [
      DocumentStatus.PENDING,
    ]);
    if (document == null) throw new BadRequestError('Document not existed.');

    const result = await this.documentService.confirm(
      confirmDocumentDto.id,
      folderId,
      request.user
    );

    if (result) return new SuccessResponse('Success', result);
    else {
      const location =
        document.folder.locker.room.department.name +
        ', ' +
        document.folder.locker.room.name +
        ', ' +
        document.folder.locker.name +
        ', ' +
        document.folder.name;
      throw new BadRequestError(
        'Failed to confirm document is placed in correct place. Correct place is ' +
          location
      );
    }
  }

  /**
   * Delete pending document (MANAGER only)
   */
  @Delete('pending/:id')
  @Security('api_key', ['MANAGER'])
  @Response<SuccessResponse>(200)
  public async deletePending(@Request() request: any, @Path() id: UUID) {
    const result = await this.documentService.deletePendingDocument(
      id,
      request.user
    );

    if (result) return new SuccessResponse('Success', result);
    else {
      throw new BadRequestError('Failed to delete pending document.');
    }
  }

  /**
   * Check can Return borrowed document (MANAGER only)
   * if return Success, 'Document can be returned on time'.
   * if return Warning, 'Document can be returned but late'.
   * Then FE will show popup to confirm to continue return or not. Then use return() API function below.
   */
  @Post('check-return')
  @Security('api_key', ['MANAGER'])
  @Response<SuccessResponse>(200)
  public async checkReturn(
    @Body() verifyReturnDocumentDto: VerifyReturnDocumentDto
  ) {
    console.log(base64toUUID(verifyReturnDocumentDto.QRCode));
    const documentId = base64toUUID(verifyReturnDocumentDto.QRCode);
    const result = await this.documentService.checkReturn(documentId);

    if (result === true)
      return new SuccessResponse(
        'Success',
        'Document can be returned on time.'
      );
    if (result === null) throw new BadRequestError('Invalid QR code');
    else return new SuccessResponse('Warning', result);
  }

  /**
   * Return borrowed document (MANAGER only)
   */
  @Post('return')
  @Security('api_key', ['MANAGER'])
  @Response<SuccessResponse>(200)
  public async return(
    @Request() request: any,
    @Body() returnDocumentDto: ReturnDocumentDto
  ) {
    console.log(base64toUUID(returnDocumentDto.QRCode));
    const documentId = base64toUUID(returnDocumentDto.QRCode);
    const result = await this.documentService.return(
      documentId,
      request.user,
      returnDocumentDto?.note
    );

    if (result)
      return new SuccessResponse(
        'Success',
        'Document was returned successfully.'
      );
    else throw new BadRequestError('Failed to return document.');
  }
}

@injectable()
@Tags('Media')
@Route('media')
export class StaticController extends Controller {
  constructor(private documentService: DocumentService) {
    super();
  }

  /**
   * Check a static file of document.
   * If user is EMPLOYEE, only check document in own department.
   * @param id The id of document
   */
  @Security('api_key', ['MANAGER', 'EMPLOYEE'])
  @Get('check/:id')
  @Response<BadRequestError>(400)
  public async checkMedia(@Path() id: string, @Request() request: any) {
    const document =
      request.user.role.name === 'EMPLOYEE'
        ? await this.documentService.getOne(
            id,
            [
              DocumentStatus.AVAILABLE,
              DocumentStatus.BORROWED,
              DocumentStatus.PENDING,
              DocumentStatus.REQUESTING,
            ],
            undefined,
            request.user.department.id,
            true
          )
        : await this.documentService.getOne(
            id,
            [
              DocumentStatus.AVAILABLE,
              DocumentStatus.BORROWED,
              DocumentStatus.PENDING,
              DocumentStatus.REQUESTING,
            ],
            undefined,
            undefined,
            true
          );
    if (document == null)
      return new SuccessResponse('Document not existed.', false);
    if (document.storageUrl == null)
      return new SuccessResponse('File not existed.', false);
    const filePath = resolve(
      __dirname,
      '../../../',
      'uploads',
      document.storageUrl
    );

    console.log(filePath);
    if (!fs.existsSync(filePath)) {
      return new SuccessResponse('File not found.', false);
    }
    return new SuccessResponse('Success', true);
  }

  /**
   * Retrieves a static file of document.
   * If user is EMPLOYEE, only get document in own department.
   * @param id The id of document
   */
  @Security('api_key', ['MANAGER', 'EMPLOYEE'])
  @Get('/:id')
  @Response<BadRequestError>(400)
  @Produces('application/pdf')
  public async getMedia(@Path() id: string, @Request() request: any) {
    const document =
      request.user.role.name === 'EMPLOYEE'
        ? await this.documentService.getOne(
            id,
            [
              DocumentStatus.AVAILABLE,
              DocumentStatus.BORROWED,
              DocumentStatus.PENDING,
              DocumentStatus.REQUESTING,
            ],
            undefined,
            request.user.department.id,
            true
          )
        : await this.documentService.getOne(
            id,
            [
              DocumentStatus.AVAILABLE,
              DocumentStatus.BORROWED,
              DocumentStatus.PENDING,
              DocumentStatus.REQUESTING,
            ],
            undefined,
            undefined,
            true
          );
    if (document == null) throw new BadRequestError('Document not existed.');
    if (document.storageUrl == null)
      throw new BadRequestError('File not existed.');
    const filePath = resolve(
      __dirname,
      '../../../',
      'uploads',
      document.storageUrl
    );
    const response = request.res;

    console.log(filePath);
    if (!fs.existsSync(filePath)) {
      throw new BadRequestError('File not found.');
    }
    if (response) {
      // this.setHeader('Content-Length', fs.statSync(filePath).size.toString());
      // this.setHeader('Accept-Ranges', 'bytes');
      this.setHeader('Content-Type', 'application/pdf');

      // const readStream = fs.createReadStream(filePath);
      // readStream.pipe(response);
      // await new Promise<void>((resolve, reject) => {
      //   readStream.on('end', () => {
      //     response.end();
      //     resolve();
      //   });
      // });
      response.setHeader('Content-Type', 'application/pdf');
      const data = fs.readFileSync(filePath);
      response.send(data.toString('base64'));
      return response;
    }
    return null;
  }
}
