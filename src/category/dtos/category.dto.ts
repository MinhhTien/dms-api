export interface CategoryDto {
  /**
   * @isString
   */
  id: string;

  /**
   * @isString
   */
  name: string;

  department: {
    id: string;
  };
}

export interface CreateCategoryDto {
  /**
   * @isString
   */
  name: string;

  department: {
    id: string;
  };
}
