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
} from 'tsoa';
import { SuccessResponse, BadRequestError } from '../constants/response';
import type { UUID } from '../type/global';
import { DepartmentService } from '../departments/department.service';
import { DepartmentDto, CreateDepartmentDto } from './dtos/department.dto';

@Tags('Department')
@Route('departments')
export class DepartmentController extends Controller {
  @Security('api_key', ['STAFF', 'EMPLOYEE'])
  @Get('{id}')
  public async getOne(@Path() id: UUID) {
    const result = await new DepartmentService().getOne(id);
    console.log(result);
    if(result) return new SuccessResponse('Success', result);
    else return new BadRequestError('Wrong department id');
  }

  @Security('api_key', ['STAFF', 'EMPLOYEE'])
  @Get('')
  public async getMany() {
    return new SuccessResponse('Success', await new DepartmentService().getAll());
  }

  @Security('api_key', ['STAFF'])
  @Post('')
  public async create(@Body() body: CreateDepartmentDto) {
    return new DepartmentService().create(body);
  }

  @Security('api_key', ['STAFF'])
  @Put('')
  public async update(@Body() body: DepartmentDto) {
    const result = await new DepartmentService().update(body);
    if (result) {
      return new SuccessResponse(
        'The department was updated successfully.',
        result
      );
    }
    throw new BadRequestError('The department could not be updated.');
  }

  @Security('api_key', ['STAFF'])
  @Delete('{id}')
  public async delete(@Path() id: UUID) {
    const result = await new DepartmentService().delete(id);
    if (result) {
      return new SuccessResponse(
        'The department was deleted successfully.',
        result
      );
    }
    throw new BadRequestError('The department could not be deleted.');
  }
}
