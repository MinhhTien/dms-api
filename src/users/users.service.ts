import { User } from './entities/user.entity';
import { AppDataSource } from '../database/data-source';
import { UserStatus } from '../constants/enum';
import { singleton } from 'tsyringe';
import { Repository } from 'typeorm';
import { UUID } from '../lib/global.type';

// A post request should not contain an id.
export type CreateUserDto = Pick<
  User,
  'email' | 'lastName' | 'firstName' | 'phone'
>;

@singleton()
export class UsersService {
  private userRepository: Repository<User>;

  constructor() {
    this.userRepository = AppDataSource.getRepository(User);
  }

  public async get(email: string): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: {
        email: email,
        status: UserStatus.ACTIVE,
      },
      relations: ['role', 'department'],
    });
    if (user === null) return null;
    return user
  }

  public async getProfile(id: UUID): Promise<User | null> {
    try {
      const user = await this.userRepository.findOne({
        where: {
          id: id,
          status: UserStatus.ACTIVE,
        },
        relations: ['role', 'department'],
      });
      if (user === null) return null;
      return user
    } catch (error) {
      console.log('Error fetching user data:', error);
      return null;
    }
  }
}
