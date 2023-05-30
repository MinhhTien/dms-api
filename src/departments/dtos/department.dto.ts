import { UUID } from '../../type/global';

export interface DepartmentDto {
  /**
  * @isUUID
  */
  id: UUID;
  /**
  * @isString
  */
  name: string;
}

export interface CreateDepartmentDto {
  /**
  * @isString
  */
  name: string;
}