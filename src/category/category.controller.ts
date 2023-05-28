import {
  Controller,
  Get,
  Route,
  Security,
  Tags,
  Response,
  Path,
  Body,
  Post,
  Put,
  Delete,
} from 'tsoa';
import { CategoryService } from './category.service';
import { BadRequestError, SuccessResponse } from './../constants/response';
import { CategoryDto, CreateCategoryDto } from './dtos/category.dto';

@Tags('Category')
@Route('category')
export class CategoryController extends Controller {
  private categoryService: CategoryService;

  constructor() {
    super();
    this.categoryService = new CategoryService();
  }

  @Security('api_key', ['STAFF', 'EMPLOYEE'])
  @Get('')
  @Response<SuccessResponse>(200)
  public async getAll() {
    const categories = await this.categoryService.getAll();
    return new SuccessResponse('Success', categories);
  }

  @Security('api_key', ['STAFF', 'EMPLOYEE'])
  @Get('{id}')
  @Response<SuccessResponse>(200)
  @Response<BadRequestError>(400)
  public async getOne(@Path() id: string) {
    const category = await this.categoryService.getOne(id);
    if (category) {
      return new SuccessResponse('Success', category);
    } else {
      throw new BadRequestError('Category not found', null);
    }
  }

  @Security('api_key', ['STAFF', 'EMPLOYEE'])
  @Response<SuccessResponse>(200)
  @Post()
  public async create(@Body() body: CreateCategoryDto) {
    const category = await this.categoryService.create(body);
    return new SuccessResponse('Success', category);
  }

  @Security('api_key', ['STAFF', 'EMPLOYEE'])
  @Response<SuccessResponse>(200)
  @Response<BadRequestError>(400)
  @Put()
  public async update(@Body() body: CategoryDto) {
    const result = await this.categoryService.update(body);
    if (result) {
      return new SuccessResponse('Successfully update category', result);
    } else {
      throw new BadRequestError('Fail to update category');
    }
  }

  @Security('api_key', ['STAFF', 'EMPLOYEE'])
  @Response<SuccessResponse>(200)
  @Response<BadRequestError>(400)
  @Delete('{id}')
  public async delete(@Path() id: string) {
    const result = await this.categoryService.delete(id);
    if (result) {
      return new SuccessResponse('Successfully delete category', result);
    } else {
      throw new BadRequestError('Fail to delete category');
    }
  }
}
