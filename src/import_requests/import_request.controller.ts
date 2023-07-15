import {
  Route,
  Post,
  Response,
  Controller,
  Tags,
  Security,
  Request,
  Body,
  Path,
  Get,
  Queries,
} from 'tsoa';
import { BadRequestError, SuccessResponse } from '../constants/response';
import { injectable } from 'tsyringe';
import { CreateImportRequestDto } from './dtos/create_import_request.dto';
import { ImportRequest } from './entities/import_request.entity';
import { ImportRequestService } from './import_request.service';
import { UUID } from '../lib/global.type';
import { RejectImportRequestDto } from './dtos/reject_import_request.dto';
import { FindImportRequestDto } from './dtos/find_import_request.dto';
import { VerifyImportRequestDto } from './dtos/verify_import_request.dto';
import { base64toUUID } from '../lib/barcode';

@injectable()
@Tags('ImportRequest')
@Route('import-requests')
export class ImportRequestController extends Controller {
  constructor(private importRequestService: ImportRequestService) {
    super();
  }

  /**
   * Retrieves All Import Requests. (MANAGER only)
   */
  @Security('api_key', ['MANAGER'])
  @Get('')
  @Response<ImportRequest[]>(200)
  public async getMany(@Queries() findImportRequestDto: FindImportRequestDto) {
    return new SuccessResponse(
      'Success',
      await this.importRequestService.getMany(findImportRequestDto)
    );
  }

  /**
   * Retrieves All Import Requests of employee. (EMPLOYEE only)
   */
  @Security('api_key', ['EMPLOYEE'])
  @Get('own')
  @Response<ImportRequest[]>(200)
  public async getOwnImportRequests(
    @Queries() findImportRequestDto: FindImportRequestDto,
    @Request() request: any
  ) {
    return new SuccessResponse(
      'Success',
      await this.importRequestService.getMany(
        findImportRequestDto,
        request.user.id
      )
    );
  }

  /**
   * Retrieves a import request.
   * If user is EMPLOYEE, only retrieves own import request.
   * @param id The id of import request
   */
  @Security('api_key', ['MANAGER', 'EMPLOYEE'])
  @Get('/:id')
  @Response<ImportRequest>(200)
  @Response<BadRequestError>(400)
  public async getOne(@Path() id: UUID, @Request() request: any) {
    const result = await this.importRequestService.getOne(
      id,
      request.user.role.name === 'EMPLOYEE' ? request.user.id : undefined
    );
    if (result !== null) return new SuccessResponse('Success', result);
    else throw new BadRequestError('Import Request not existed.');
  }

  /**
   * Create import document request (EMPLOYEE only)
   */
  @Post('')
  @Security('api_key', ['EMPLOYEE'])
  @Response<SuccessResponse>(200)
  public async create(
    @Request() request: any,
    @Body() createImportRequestDto: CreateImportRequestDto
  ) {
    const result = await this.importRequestService.create(
      createImportRequestDto,
      request.user
    );
    if (result instanceof ImportRequest)
      return new SuccessResponse('Success', {
        id: result.id,
        status: result.status,
        document: {
          id: result.document.id,
          name: result.document.name,
          status: result.document.status,
        },
      });
    if (result == null)
      throw new BadRequestError('Failed to create import request.');
    else throw new BadRequestError(result);
  }

  /**
   * Accept import request (MANAGER only)
   * @param id The id of import request
   */
  @Post('accept/:id')
  @Security('api_key', ['MANAGER'])
  @Response<SuccessResponse>(200)
  public async accept(@Request() request: any, @Path() id: UUID) {
    const result = await this.importRequestService.accept(id, request.user);

    if (result instanceof ImportRequest)
      return new SuccessResponse('Success', true);
    if (result == null)
      throw new BadRequestError('Failed to accept import request.');
    else throw new BadRequestError(result);
  }

  /**
   * Verify accepted import request (MANAGER only)
   * @param id The id of import request
   */
  @Post('verify')
  @Security('api_key', ['MANAGER'])
  @Response<SuccessResponse>(200)
  public async verify(
    @Request() request: any,
    @Body() verifyImportRequestDto: VerifyImportRequestDto
  ) {
    console.log(base64toUUID(verifyImportRequestDto.QRCode));
    const importRequestId = base64toUUID(verifyImportRequestDto.QRCode);
    const result = await this.importRequestService.verify(
      importRequestId,
      request.user
    );

    if (result instanceof ImportRequest)
      return new SuccessResponse('Success', true);
    if (result == null)
      throw new BadRequestError('Failed to verify import request.');
    else throw new BadRequestError(result);
  }

  /**
   * Reject import request (MANAGER only)
   */
  @Post('reject')
  @Security('api_key', ['MANAGER'])
  @Response<SuccessResponse>(200)
  public async reject(
    @Request() request: any,
    @Body() rejectImportRequestDto: RejectImportRequestDto
  ) {
    const result = await this.importRequestService.reject(
      rejectImportRequestDto,
      request.user
    );

    if (result instanceof ImportRequest)
      return new SuccessResponse('Success', true);
    if (result == null)
      throw new BadRequestError('Failed to reject import request.');
    else throw new BadRequestError(result);
  }

  /**
   * Cancel import request (EMPLOYEE only)
   * @param id The id of import request
   */
  @Post('cancel/:id')
  @Security('api_key', ['EMPLOYEE'])
  @Response<SuccessResponse>(200)
  public async cancel(@Request() request: any, @Path() id: UUID) {
    const result = await this.importRequestService.cancel(id, request.user);

    if (result instanceof ImportRequest)
      return new SuccessResponse('Success', true);
    if (result == null)
      throw new BadRequestError('Failed to cancel import request.');
    else throw new BadRequestError(result);
  }
}
