import { User } from './entities/user.entity';
import { AppDataSource } from '../database/data-source';
import { Status } from '../constants/enum';

// A post request should not contain an id.
export type CreateUserDto = Pick<
  User,
  'email' | 'last_name' | 'first_name' | 'phone'
>;

export class UsersService {
  public async get(email: string): Promise<User | null> {
    return await AppDataSource.getRepository(User).findOne({
      where: {
        email: email,
        status: Status.ACTIVE,
      },
      relations: ['role', 'department'],
    });
  }
}
