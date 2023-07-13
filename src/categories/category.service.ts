import { Repository } from 'typeorm';
import { AppDataSource } from '../database/data-source';
import { Category } from './entities/category.entity';
import {
  CategoryDto,
  CreateCategoryDto,
  UpdateCategoryDto,
} from './dtos/category.dto';
import { UUID } from '../lib/global.type';

export class CategoryService {
  private categoryRepo: Repository<Category>;

  constructor() {
    this.categoryRepo = AppDataSource.getRepository(Category);
  }

  public async getAll(): Promise<Category[]> {
    return await this.categoryRepo.find({ relations: ['department'], order: { name: 'ASC' } });
  }

  public async getByDepartment(departmentId: UUID): Promise<Category[]> {
    return await this.categoryRepo.find({
      where: { department: { id: departmentId } },
      relations: ['department'],
      order: { name: 'ASC' },
    });
  }

  public async getOne(id: UUID): Promise<CategoryDto | null> {
    return await this.categoryRepo.findOne({
      where: { id: id },
      relations: ['department'],
    });
  }

  public async create(categoryDto: CreateCategoryDto) {
    try {
      const category = this.categoryRepo.create(categoryDto);
      return await this.categoryRepo.save(category);
    } catch (error: any) {
      console.log('====');
      console.error(error?.driverError?.detail);
      console.log('====');
      if (error?.driverError?.detail?.includes('already exists')) {
        return 'Category name is already existed.';
      }
      if (error?.driverError?.detail?.includes('is not present')) {
        return 'Department is not existed.';
      }
      return null;
    }
  }

  public async update(categoryDto: UpdateCategoryDto) {
    try {
      const result = await this.categoryRepo.update(
        {
          id: categoryDto.id,
        },
        categoryDto
      );
      return result.affected === 1;
    } catch (error: any) {
      console.log('====');
      console.error(error?.driverError?.detail);
      console.log('====');
      if (error?.driverError?.detail?.includes('already exists')) {
        return 'Category name is already existed.';
      }
      return false;
    }
  }

  public async delete(id: UUID) {
    try {
      const result = await this.categoryRepo.delete(id);
      const affectedRow = result.affected;
      return affectedRow ? true : false;
    } catch (error: any) {
      console.log('====');
      console.error(error?.code);
      console.error(error?.driverError?.detail);
      console.log('====');
      if (error?.driverError?.detail?.includes('still referenced')) {
        return 'Category already is used by some documents';
      }
      return false;
    }
  }
}
