import { User } from './entities/user.entity';
import { AppDataSource } from '../database/data-source';
import { UserStatus } from '../constants/enum';
import { getAuth } from 'firebase-admin/auth';
import { singleton } from 'tsyringe';
import { Repository } from 'typeorm';
import { UUID } from '../lib/global.type';

// A post request should not contain an id.
export type CreateUserDto = Pick<
  User,
  'email' | 'lastName' | 'firstName' | 'phone'
>;

export type UserProfile = User & {
  photoURL?: string;
};

@singleton()
export class UsersService {
  private userRepository: Repository<User>;

  constructor() {
    this.userRepository = AppDataSource.getRepository(User);
  }

  public async get(email: string): Promise<UserProfile | null> {
    const user = await this.userRepository.findOne({
      where: {
        email: email,
        status: UserStatus.ACTIVE,
      },
      relations: ['role', 'department'],
    });
    if (user === null) return null;
    const userRecord = await getAuth().getUserByEmail(user.email);
    return {
      photoURL: userRecord.photoURL,
      ...user,
    };
  }

  public async getProfile(id: UUID): Promise<UserProfile | null> {
    try {
      const user = await this.userRepository.findOne({
        where: {
          id: id,
          status: UserStatus.ACTIVE,
        },
        relations: ['role', 'department'],
      });
      if (user === null) return null;
      const userRecord = await getAuth().getUserByEmail(user.email);
      console.log(`Successfully fetched user data: ${userRecord.photoURL}`);
      return {
        photoURL: userRecord.photoURL,
        ...user,
      };
    } catch (error) {
      console.log('Error fetching user data:', error);
      return null;
    }
  }
}
