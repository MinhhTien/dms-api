import { UUID } from '../../type/global';

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