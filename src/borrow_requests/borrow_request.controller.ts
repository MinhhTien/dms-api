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
  Query,
} from 'tsoa';
import { BadRequestError, SuccessResponse } from '../constants/response';
import { injectable } from 'tsyringe';
import { CreateBorrowRequestDto } from './dtos/create_borrow_request.dto';
import { BorrowRequest } from './entities/borrow_request.entity';
import { BorrowRequestService } from './borrow_request.service';
import { UUID } from '../lib/global.type';
import { RejectBorrowRequestDto } from './dtos/reject_borrow_request.dto';

@injectable()
@Tags('BorrowRequest')
@Route('borrow-requests')
export class BorrowRequestController extends Controller {
  constructor(private borrowRequestService: BorrowRequestService) {
    super();
  }

  /**
   * Retrieves a borrow request.
   * If user is EMPLOYEE, only retrieves own borrow request.
   * @param id The id of borrow request
   */
  @Security('api_key', ['STAFF', 'EMPLOYEE'])
  @Get('/:id')
  @Response<BorrowRequest>(200)
  @Response<BadRequestError>(400)
  public async getOne(@Path() id: UUID, @Request() request: any) {
    const result = await this.borrowRequestService.getOne(
      id,
      request.user.role === 'EMPLOYEE' ? request.user.id : undefined
    );
    if (result !== null) return new SuccessResponse('Success', result);
    else throw new BadRequestError('Borrow Request not existed.');
  }

  /**
   * Retrieves All Borrow Request of a document. (STAFF only)
   * @param documentId The id of document
   */
  @Security('api_key', ['STAFF'])
  @Get('')
  @Response<BorrowRequest[]>(200)
  public async getManyOfDocument(@Query() documentId: UUID) {
    return new SuccessResponse(
      'Success',
      await this.borrowRequestService.getMany(documentId)
    );
  }

  /**
   * Retrieves All Borrow Request of employee. (EMPLOYEE only)
   */
  @Security('api_key', ['EMPLOYEE'])
  @Get('own')
  @Response<BorrowRequest[]>(200)
  public async getOwnBorrowRequests(@Request() request: any) {
    return new SuccessResponse(
      'Success',
      await this.borrowRequestService.getMany(undefined, request.user.id)
    );
  }

  /**
   * Create borrow document request (EMPLOYEE only)
   */
  @Post('')
  @Security('api_key', ['EMPLOYEE'])
  @Response<SuccessResponse>(200)
  public async create(
    @Request() request: any,
    @Body() createBorrowRequestDto: CreateBorrowRequestDto
  ) {
    const result = await this.borrowRequestService.create(
      createBorrowRequestDto,
      request.user
    );
    if (result instanceof BorrowRequest)
      return new SuccessResponse('Success', {
        id: result.id,
      });
    if (result == null)
      throw new BadRequestError('Failed to create borrow request.');
    else throw new BadRequestError(result);
  }

  /**
   * Accept borrow request (STAFF only)
   */
  @Post('accept/:id')
  @Security('api_key', ['STAFF'])
  @Response<SuccessResponse>(200)
  public async accept(@Request() request: any, @Path() id: UUID) {
    const result = await this.borrowRequestService.accept(id, request.user);

    if (result instanceof BorrowRequest)
      return new SuccessResponse('Success', true);
    if (result == null)
      throw new BadRequestError('Failed to accept borrow request.');
    else throw new BadRequestError(result);
  }

  /**
   * Reject borrow request (STAFF only)
   */
  @Post('reject')
  @Security('api_key', ['STAFF'])
  @Response<SuccessResponse>(200)
  public async reject(
    @Request() request: any,
    @Body() rejectBorrowRequestDto: RejectBorrowRequestDto
  ) {
    const result = await this.borrowRequestService.reject(
      rejectBorrowRequestDto,
      request.user
    );

    if (result instanceof BorrowRequest)
      return new SuccessResponse('Success', true);
    if (result == null)
      throw new BadRequestError('Failed to reject borrow request.');
    else throw new BadRequestError(result);
  }

  /**
   * Cancel borrow request (EMPLOYEE only)
   */
  @Post('cancel/:id')
  @Security('api_key', ['EMPLOYEE'])
  @Response<SuccessResponse>(200)
  public async cancel(@Request() request: any, @Path() id: UUID) {
    const result = await this.borrowRequestService.cancel(id, request.user);

    if (result instanceof BorrowRequest)
      return new SuccessResponse('Success', true);
    if (result == null)
      throw new BadRequestError('Failed to cancel borrow request.');
    else throw new BadRequestError(result);
  }
}
