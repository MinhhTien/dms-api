import { Repository } from 'typeorm';
import { AppDataSource } from '../database/data-source';
import { Category } from './entities/category.entity';
import { CategoryDto, CreateCategoryDto } from './dtos/category.dto';

export class CategoryService {
  private categoryRepo: Repository<Category>;

  constructor() {
    this.categoryRepo = AppDataSource.getRepository(Category);
  }
  public async getAll(): Promise<Category[]> {
    return await this.categoryRepo.find({ relations: ['department'] });
  }

  public async getOne(id: string): Promise<CategoryDto | null> {
    return await this.categoryRepo.findOne({
      where: { id: id },
      relations: ['department'],
    });
  }

  public async create(
    categoryDto: CreateCategoryDto
  ): Promise<CategoryDto | null> {
    let category = this.categoryRepo.create(categoryDto);
    category = await this.categoryRepo.save(category);
    return category;
  }

  public async update(categoryDto: CategoryDto): Promise<boolean> {
    const result = await this.categoryRepo.update(
      {
        id: categoryDto.id,
      },
      categoryDto
    );
    const affectedRow = result.affected;
    return affectedRow ? true : false;
  }

  public async delete(id: string): Promise<boolean> {
    const result = await this.categoryRepo.delete(id);
    const affectedRow = result.affected;
    return affectedRow ? true : false;
  }
}
