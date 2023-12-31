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
import { CreateBorrowRequestDto } from './dtos/create_borrow_request.dto';
import { BorrowRequest } from './entities/borrow_request.entity';
import { BorrowRequestService } from './borrow_request.service';
import { UUID } from '../lib/global.type';
import { RejectBorrowRequestDto } from './dtos/reject_borrow_request.dto';
import { FindBorrowRequestDto } from './dtos/find_borrow_request.dto';
import { VerifyBorrowRequestDto } from './dtos/verify_borrow_request.dto';
import { base64toUUID } from '../lib/barcode';
import { sendToSubscriber, sendToManagerTopic } from '../lib/notification';
import { NotificationType } from '../constants/enum';

@injectable()
@Tags('BorrowRequest')
@Route('borrow-requests')
export class BorrowRequestController extends Controller {
  constructor(private borrowRequestService: BorrowRequestService) {
    super();
  }

  /**
   * Retrieves All Borrow Request of a document. (MANAGER only)
   */
  @Security('api_key', ['MANAGER'])
  @Get('')
  @Response<BorrowRequest[]>(200)
  public async getManyOfDocument(
    @Queries() findBorrowRequestDto: FindBorrowRequestDto
  ) {
    return new SuccessResponse(
      'Success',
      await this.borrowRequestService.getMany(findBorrowRequestDto, findBorrowRequestDto?.createdBy)
    );
  }

  /**
   * Retrieves All Borrow Request of employee. (EMPLOYEE only)
   */
  @Security('api_key', ['EMPLOYEE'])
  @Get('own')
  @Response<BorrowRequest[]>(200)
  public async getOwnBorrowRequests(
    @Request() request: any,
    @Queries() findBorrowRequestDto: FindBorrowRequestDto
  ) {
    findBorrowRequestDto.documentId = undefined;
    return new SuccessResponse(
      'Success',
      await this.borrowRequestService.getMany(
        findBorrowRequestDto,
        request.user.id
      )
    );
  }

  /**
   * Retrieves a borrow request.
   * If user is EMPLOYEE, only retrieves own borrow request.
   * @param id The id of borrow request
   */
  @Security('api_key', ['MANAGER', 'EMPLOYEE'])
  @Get('/:id')
  @Response<BorrowRequest>(200)
  @Response<BadRequestError>(400)
  public async getOne(@Path() id: UUID, @Request() request: any) {
    const result = await this.borrowRequestService.getOne(
      id,
      request.user.role.name === 'EMPLOYEE' ? request.user.id : undefined
    );
    if (result !== null) return new SuccessResponse('Success', result);
    else throw new BadRequestError('Borrow Request not existed.');
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
    if (result instanceof BorrowRequest) {
      const user = request.user;
      sendToManagerTopic(
        NotificationType.BORROW,
        user.firstName + ' ' + user.lastName,
        `has created a new borrow request for document ${result.document.name}. Please check it out.`
      );

      return new SuccessResponse('Success', {
        id: result.id,
      });
    }
    if (result == null)
      throw new BadRequestError('Failed to create borrow request.');
    else throw new BadRequestError(result);
  }

  /**
   * Accept borrow request (MANAGER only)
   */
  @Post('accept/:id')
  @Security('api_key', ['MANAGER'])
  @Response<SuccessResponse>(200)
  public async accept(@Request() request: any, @Path() id: UUID) {
    const result = await this.borrowRequestService.accept(id, request.user);

    if (result instanceof BorrowRequest) {
      sendToSubscriber(
        NotificationType.BORROW,
        result.createdBy.id,
        `Borrow request for document ${result.document.name} has been approved.`,
        `Please show generated QRCode to manager for verification within 3 days to receive the document`
      );

      return new SuccessResponse('Success', true);
    }
    if (result == null)
      throw new BadRequestError('Failed to accept borrow request.');
    else throw new BadRequestError(result);
  }

  /**
   * Verify accepted borrow request (MANAGER only)
   */
  @Post('verify')
  @Security('api_key', ['MANAGER'])
  @Response<SuccessResponse>(200)
  public async verify(
    @Request() request: any,
    @Body() verifyBorrowRequestDto: VerifyBorrowRequestDto
  ) {
    console.log(base64toUUID(verifyBorrowRequestDto.QRCode));
    const borrowRequestId = base64toUUID(verifyBorrowRequestDto.QRCode);
    const result = await this.borrowRequestService.verify(
      borrowRequestId,
      request.user
    );

    if (result instanceof BorrowRequest)
      return new SuccessResponse('Success', true);
    if (result == null)
      throw new BadRequestError('Failed to verify accepted borrow request.');
    else throw new BadRequestError(result);
  }

  /**
   * Reject borrow request (MANAGER only)
   */
  @Post('reject')
  @Security('api_key', ['MANAGER'])
  @Response<SuccessResponse>(200)
  public async reject(
    @Request() request: any,
    @Body() rejectBorrowRequestDto: RejectBorrowRequestDto
  ) {
    const result = await this.borrowRequestService.reject(
      rejectBorrowRequestDto,
      request.user
    );

    if (result instanceof BorrowRequest) {
      sendToSubscriber(
        NotificationType.BORROW,
        result.createdBy.id,
        `Your borrow request for document ${result.document.name} has been rejected.`,
        `Please check reason and try again.`
      );

      return new SuccessResponse('Success', true);
    }
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
