import { Repository } from 'typeorm';
import { AppDataSource } from '../database/data-source';
import { Category } from './entities/category.entity';
import { CategoryDto, CreateCategoryDto, UpdateCategoryDto } from './dtos/category.dto';
import { UUID } from '../lib/global.type';

export class CategoryService {
  private categoryRepo: Repository<Category>;

  constructor() {
    this.categoryRepo = AppDataSource.getRepository(Category);
  }

  public async getAll(): Promise<Category[]> {
    return await this.categoryRepo.find({ relations: ['department'] });
  }

  public async getByDepartment(departmentId: UUID): Promise<Category[]> {
    return await this.categoryRepo.find({
      where: { department: { id: departmentId } },
      relations: ['department'],
    });
  }

  public async getOne(id: UUID): Promise<CategoryDto | null> {
    return await this.categoryRepo.findOne({
      where: { id: id },
      relations: ['department'],
    });
  }

  public async create(
    categoryDto: CreateCategoryDto
  ): Promise<CategoryDto | null> {
    try {
      let category = this.categoryRepo.create(categoryDto);
      category = await this.categoryRepo.save(category);
      return category;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  public async update(categoryDto: UpdateCategoryDto): Promise<boolean> {
    try {
      const result = await this.categoryRepo.update(
        {
          id: categoryDto.id,
        },
        categoryDto
      );
      const affectedRow = result.affected;
      return affectedRow ? true : false;
    } catch (error) {
      console.log(error);
      return false;
    }
  }

  public async delete(id: UUID): Promise<boolean> {
    try {
      const result = await this.categoryRepo.delete(id);
      const affectedRow = result.affected;
      return affectedRow ? true : false;
    } catch (error) {
      console.log(error);
      return false;
    }
  }
}
