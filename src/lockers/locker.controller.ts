import {
  Controller,
  Get,
  Route,
  Security,
  Tags,
  Path,
  Post,
  Body,
  Put,
  Delete,
  Response,
  Request,
  Query,
} from 'tsoa';
import { SuccessResponse, BadRequestError } from '../constants/response';
import type { UUID } from '../lib/global.type';
import { UpdateLockerDto, CreateLockerDto } from './dtos/locker.dto';
import { Locker } from './entities/locker.entity';
import { injectable } from 'tsyringe';
import { LockerService } from './locker.service';

@injectable()
@Tags('Locker')
@Route('lockers')
export class LockerController extends Controller {
  constructor(private lockerService: LockerService) {
    super();
  }

  /**
   * Retrieves a Locker.
   * If user is EMPLOYEE, only get locker of room in own department.
   * @param id The id of room
   */
  @Security('api_key', ['STAFF', 'EMPLOYEE'])
  @Get('/:id')
  @Response<Locker>(200)
  @Response<BadRequestError>(400)
  public async getOne(@Path() id: UUID, @Request() request: any) {
    const result = await this.lockerService.getOne(
      id,
      request.user.role.name === 'EMPLOYEE'
        ? request.user.department.id
        : undefined // if user is employee, only get rooms of his department
    );
    if (result !== null) return new SuccessResponse('Success', result);
    else throw new BadRequestError('Locker not existed.');
  }

  /**
   * Retrieves Lockers (of room if roomId is provided).
   * If user is EMPLOYEE, only get lockers of room in own department.
   * @param roomId The id of room
   */
  @Security('api_key', ['STAFF', 'EMPLOYEE'])
  @Get('')
  @Response<Locker[]>(200)
  public async getMany(@Request() request: any, @Query() roomId: UUID) {
    return new SuccessResponse(
      'Success',
      await this.lockerService.getMany(
        roomId,
        request.user.role.name === 'EMPLOYEE'
          ? request.user.department.id
          : undefined
      )
    );
  }

  /**
   * Create locker (STAFF only)
   */
  @Security('api_key', ['STAFF'])
  @Post('')
  public async create(@Body() body: CreateLockerDto) {
    const result = await this.lockerService.create(body);
    if (result instanceof Locker) {
      return new SuccessResponse('Locker was created successfully.', result);
    }
    if (result == null)
      throw new BadRequestError('Locker could not be created.');
    else throw new BadRequestError(result);
  }

  /**
   * Update locker (STAFF only)
   */
  @Security('api_key', ['STAFF'])
  @Put('')
  public async update(@Body() body: UpdateLockerDto) {
    const result = await this.lockerService.update(body);
    if (result === true) {
      return new SuccessResponse('Locker was updated successfully.', result);
    }
    if (result === false)
      throw new BadRequestError('Locker could not be updated.');
    else throw new BadRequestError(result);
  }

  /**
   * Delete locker (STAFF only)
   * If locker has folders, delete will be failed.
   * @param id The id of locker
   */
  @Security('api_key', ['STAFF'])
  @Delete('{id}')
  public async delete(@Path() id: UUID) {
    // need validate if locker has folders
    const result = await this.lockerService.delete(id);
    if (result) {
      return new SuccessResponse('Locker was deleted successfully.', result);
    }
    throw new BadRequestError('Locker could not be deleted.');
  }
}
