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
  Query,
} from 'tsoa';
import { CategoryService } from './category.service';
import { BadRequestError, SuccessResponse } from './../constants/response';
import {
  CategoryDto,
  CreateCategoryDto,
  UpdateCategoryDto,
} from './dtos/category.dto';
import { UUID } from '../lib/global.type';
import { Category } from './entities/category.entity';

@Tags('Category')
@Route('categories')
export class CategoryController extends Controller {
  private categoryService: CategoryService;

  constructor() {
    super();
    this.categoryService = new CategoryService();
  }

  /**
   * Retrieves all categories.
   * @param departmentId The id of department (optional)
   */
  @Security('api_key', ['MANAGER', 'EMPLOYEE'])
  @Get('')
  @Response<SuccessResponse>(200)
  public async getAll(@Query() departmentId?: UUID) {
    let categories: CategoryDto[];
    if (departmentId) {
      console.log(departmentId);
      categories = await this.categoryService.getByDepartment(departmentId);
    } else {
      categories = await this.categoryService.getAll();
    }
    return new SuccessResponse('Success', categories);
  }

  /**
   * Retrieves a category.
   * @param id The id of category
   */
  @Security('api_key', ['MANAGER', 'EMPLOYEE'])
  @Get('{id}')
  @Response<SuccessResponse>(200)
  @Response<BadRequestError>(400)
  public async getOne(
    @Path()
    id: UUID
  ) {
    const category = await this.categoryService.getOne(id);
    if (category) {
      return new SuccessResponse('Success', category);
    } else {
      throw new BadRequestError('Category not found');
    }
  }

  /**
   * Create new category.(MANAGER only)
   */
  @Security('api_key', ['MANAGER'])
  @Response<SuccessResponse>(200)
  @Post()
  public async create(@Body() body: CreateCategoryDto) {
    const result = await this.categoryService.create(body);
    if (result instanceof Category) {
      return new SuccessResponse('Category was created successfully.', result);
    }
    if (result == null)
      throw new BadRequestError('Category could not be created.');
    else throw new BadRequestError(result);
  }

  /**
   * Update category.(MANAGER only)
   */
  @Security('api_key', ['MANAGER'])
  @Response<SuccessResponse>(200)
  @Response<BadRequestError>(400)
  @Put()
  public async update(@Body() body: UpdateCategoryDto) {
    const result = await this.categoryService.update(body);
    if (result === true) {
      return new SuccessResponse('Category was updated successfully.', result);
    }
    if (result === false)
      throw new BadRequestError('Category could not be updated.');
    else throw new BadRequestError(result);
  }

  /**
   * Delete category.(MANAGER only)
   * @param id The id of category
   */
  @Security('api_key', ['MANAGER'])
  @Response<SuccessResponse>(200)
  @Response<BadRequestError>(400)
  @Delete('{id}')
  public async delete(@Path() id: UUID) {
    const result = await this.categoryService.delete(id);
    if (result === true) {
      return new SuccessResponse('Delete category successfully.', result);
    }
    if (result === false)
      throw new BadRequestError('Category could not be deleted.');
    throw new BadRequestError(result);
  }
}
