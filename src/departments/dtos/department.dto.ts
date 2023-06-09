import { UUID } from '../../lib/global.type';

export interface CreateDepartmentDto {
  /**
   * @isString
   */
  name: string;
}
export interface UpdateDepartmentDto extends CreateDepartmentDto {
  /**
   * @isUUID
   */
  id: UUID;
}
