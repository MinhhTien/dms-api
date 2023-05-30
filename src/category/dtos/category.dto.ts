import { UUID } from "../../type/global";

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
