import { UUID } from '../../type/global';

export interface DepartmentDto {
  id: UUID;
  name: string;
}

export interface CreateDepartmentDto {
  name: string;
}