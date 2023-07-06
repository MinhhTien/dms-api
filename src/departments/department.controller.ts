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
} from 'tsoa';
import { SuccessResponse, BadRequestError } from '../constants/response';
import type { UUID } from '../lib/global.type';
import { DepartmentService } from '../departments/department.service';
import {
  UpdateDepartmentDto,
  CreateDepartmentDto,
} from './dtos/department.dto';
import { Department } from './entities/department.entity';
import { injectable } from 'tsyringe';

@injectable()
@Tags('Department')
@Route('departments')
export class DepartmentController extends Controller {
  constructor(private departmentService: DepartmentService) {
    super();
  }

  /**
   * Retrieves departments.
   */
  @Security('api_key', ['STAFF', 'EMPLOYEE'])
  @Get('')
  @Response<Department[]>(200)
  public async getMany() {
    return new SuccessResponse(
      'Success',
      await this.departmentService.getAll()
    );
  }

  /**
   * Count departments.
   */
  @Security('api_key', ['STAFF', 'EMPLOYEE'])
  @Get('count')
  @Response<number>(200)
  public async count() {
    return new SuccessResponse(
      'Success',
      await this.departmentService.count()
    );
  }

  /**
   * Retrieves a department.
   * @param id The id of department
   */
  @Security('api_key', ['STAFF', 'EMPLOYEE'])
  @Get('/:id')
  @Response<Department>(200)
  @Response<BadRequestError>(400)
  public async getOne(@Path() id: UUID) {
    const result = await this.departmentService.getOne(id);
    if (result !== null) return new SuccessResponse('Success', result);
    else throw new BadRequestError('Department not existed.');
  }

  /**
   * Creates a department. (STAFF only)
   */
  @Security('api_key', ['STAFF'])
  @Post('')
  public async create(@Body() body: CreateDepartmentDto) {
    const result = await this.departmentService.create(body);
    if (result) {
      return new SuccessResponse(
        'Department was created successfully.',
        result
      );
    } else throw new BadRequestError('Department name is already existed.');
  }

  /**
   * Updates a department. (STAFF only)
   */
  @Security('api_key', ['STAFF'])
  @Put('')
  public async update(@Body() body: UpdateDepartmentDto) {
    const result = await this.departmentService.update(body);
    if (result) {
      return new SuccessResponse(
        'Department was updated successfully.',
        result
      );
    }
    throw new BadRequestError('Department could not be updated.');
  }

  /**
   * Deletes a department. (STAFF only)
   * @param id The id of department
   */
  @Security('api_key', ['STAFF'])
  @Delete('{id}')
  public async delete(@Path() id: UUID) {
    const result = await this.departmentService.delete(id);
    if (result === true) {
      return new SuccessResponse(
        'Department was deleted successfully.',
        result
      );
    }
    if (result === false)
      throw new BadRequestError('Department could not be deleted.');
    throw new BadRequestError(result);
  }
}

@injectable()
@Tags('TreeDocument')
@Route('trees')
export class TreeDocument extends Controller {
  constructor(private departmentService: DepartmentService) {
    super();
  }

  /**
   * Retrieves tree location.
   */
  @Security('api_key', ['STAFF', 'EMPLOYEE'])
  @Get('')
  @Response<SuccessResponse>(200)
  public async getMany(@Request() request: any) {
    return new SuccessResponse(
      'Success',
      await this.departmentService.getTree(
        request.user.role.name === 'EMPLOYEE'
          ? request.user.department.id
          : undefined
      )
    );
  }
}
