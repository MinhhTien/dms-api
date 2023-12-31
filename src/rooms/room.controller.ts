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
import { RoomService } from '../rooms/room.service';
import { UpdateRoomDto, CreateRoomDto } from './dtos/room.dto';
import { Room } from './entities/room.entity';
import { injectable } from 'tsyringe';

@injectable()
@Tags('Room')
@Route('rooms')
export class RoomController extends Controller {
  constructor(private roomService: RoomService) {
    super();
  }

  /**
   * Retrieves a room.
   * If user is EMPLOYEE, only get room of own department.
   * @param id The id of room
   */
  @Security('api_key', ['MANAGER', 'EMPLOYEE'])
  @Get('/:id')
  @Response<Room>(200)
  @Response<BadRequestError>(400)
  public async getOne(@Path() id: UUID, @Request() request: any) {
    const result = await this.roomService.getOne(
      id,
      request.user.role.name === 'EMPLOYEE'
        ? request.user.department.id
        : undefined // if user is employee, only get rooms of his department
    );
    if (result !== null) return new SuccessResponse('Success', result);
    else throw new BadRequestError('Room not existed.');
  }

  /**
   * Retrieves rooms (of department if departmentId is provided).
   * If user is EMPLOYEE, only get rooms of own department.
   * @param departmentId The id of department (MANAGER only)
   */
  @Security('api_key', ['MANAGER', 'EMPLOYEE'])
  @Get('')
  @Response<Room[]>(200)
  public async getMany(@Request() request: any, @Query() departmentId: UUID) {
    const departmentIdQuery =
      request.user.role.name === 'EMPLOYEE'
        ? request.user.department.id
        : departmentId;
    return new SuccessResponse(
      'Success',
      await this.roomService.getAll(departmentIdQuery)
    );
  }

  /**
   * Create room (MANAGER only)
   */
  @Security('api_key', ['MANAGER'])
  @Post('')
  public async create(@Body() body: CreateRoomDto) {
    const result = await this.roomService.create(body);
    if (result instanceof Room) {
      return new SuccessResponse('Room was created successfully.', result);
    }
    if (result == null) throw new BadRequestError('Room could not be created.');
    else throw new BadRequestError(result);
  }

  /**
   * Update room (MANAGER only)
   */
  @Security('api_key', ['MANAGER'])
  @Put('')
  public async update(@Body() body: UpdateRoomDto) {
    const result = await this.roomService.update(body);
    if (result === true) {
      return new SuccessResponse('Room was updated successfully.', result);
    }
    if (result === false)
      throw new BadRequestError('Room could not be updated.');
    else throw new BadRequestError(result);
  }

  /**
   * Delete room (MANAGER only)
   * If room has lockers, delete will be failed.
   * @param id The id of room
   */
  @Security('api_key', ['MANAGER'])
  @Delete('{id}')
  public async delete(@Path() id: UUID) {
    // need validate if room has lockers
    const result = await this.roomService.delete(id);
    if (result === true)
      return new SuccessResponse('Room was deleted successfully.', result);

    if (result === false)
      throw new BadRequestError('Room could not be deleted.');
    throw new BadRequestError(result);
  }
}
