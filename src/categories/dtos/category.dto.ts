import { UUID } from '../../lib/global.type';

export interface CategoryDto {
  id: UUID;

  /**
   * @isString
   */
  name: string;

  department: {
    id: UUID;
  };
}

export interface CreateCategoryDto {
  /**
   * @isString
   */
  name: string;

  department: {
    id: UUID;
  };
}

export interface UpdateCategoryDto {
  id: UUID;

  /**
   * @isString
   */
  name: string;
}
