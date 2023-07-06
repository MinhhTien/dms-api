import { User } from './entities/user.entity';
import { AppDataSource } from '../database/data-source';
import { UserStatus } from '../constants/enum';
import { singleton } from 'tsyringe';
import { Repository } from 'typeorm';
import { UUID } from '../lib/global.type';
import { getAuth } from 'firebase-admin/auth';
import { redisClient } from '../index';
import { CreateUserDto } from './dtos/create-user.dto';
import { Role } from './entities/role.entity';

@singleton()
export class UsersService {
  private userRepository: Repository<User>;
  private roleRepository: Repository<Role>;

  constructor() {
    this.userRepository = AppDataSource.getRepository(User);
    this.roleRepository = AppDataSource.getRepository(Role);
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
    return user;
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
      return user;
    } catch (error) {
      console.log('Error fetching user data:', error);
      return null;
    }
  }

  public async revokeRefreshToken(email: string): Promise<boolean> {
    try {
      const userRecord = await getAuth().getUserByEmail(email);
      Promise.all([
        getAuth().revokeRefreshTokens(userRecord.uid),
        redisClient.del(userRecord.uid),
      ]);
      return true;
    } catch (error) {
      console.log('Error revoking refresh token:', error);
      return false;
    }
  }

  public async getAll() {
    try {
      const users = await this.userRepository.find({
        where: {
          status: UserStatus.ACTIVE,
        },
      });
      return users;
    } catch (error) {
      console.log('Error fetching user data:', error);
      return null;
    }
  }

  public async count(departmentId?: UUID) {
    try {
      return await this.userRepository.count({
        where: {
          status: UserStatus.ACTIVE,
          ...(departmentId && {
            department: {
              id: departmentId,
            },
          }),
        },
      });
    } catch (error) {
      console.log(error);
      return 0;
    }
  }

  public async update(id: UUID, user: any) {
    try {
      const result = await this.userRepository.update(id, {
        photoURL: user.photoURL,
      });
      return result.affected;
    } catch (error) {
      console.log('Error fetching user data:', error);
      return null;
    }
  }

  public async create(createUserDto: CreateUserDto) {
    try {
      const role = await this.roleRepository.findOne({
        where: {
          name: 'EMPLOYEE',
        },
      });
      if (role === null) return null;
      const user = this.userRepository.create(createUserDto);
      user.role = role;
      user.photoURL =
        'https://lh3.googleusercontent.com/-XdUIqdMkCWA/AAAAAAAAAAI/AAAAAAAAAAA/4252rscbv5M/photo.jpg';
      const result = await this.userRepository.save(user);
      return result;
    } catch (error: any) {
      console.log('====');
      console.error(error?.driverError?.detail);
      console.log('====');
      if (
        error?.driverError?.detail?.includes(
          'is not present in table "department".'
        )
      ) {
        return 'Department is not existed.';
      }
      if (error?.driverError?.detail?.includes('already exists')) {
        if (error?.driverError?.detail?.includes('email')) {
          return 'Email is already existed.';
        }
        if (error?.driverError?.detail?.includes('phone')) {
          return 'Phone is already existed.';
        }
        if (error?.driverError?.detail?.includes('code')) {
          return 'Code is already existed.';
        }
      }
      return null;
    }
  }

  public async disable(id: UUID) {
    try {
      const result = await this.userRepository.update(
        {
          id: id,
          status: UserStatus.ACTIVE,
        },
        {
          status: UserStatus.INACTIVE,
        }
      );
      return result.affected;
    } catch (error) {
      console.log('Error fetching user data:', error);
      return null;
    }
  }

  public async enable(id: UUID) {
    try {
      const result = await this.userRepository.update(
        {
          id: id,
          status: UserStatus.INACTIVE,
        },
        {
          status: UserStatus.ACTIVE,
        }
      );
      return result.affected;
    } catch (error) {
      console.log('Error fetching user data:', error);
      return null;
    }
  }

  public async delete(id: UUID) {
    try {
      const result = await this.userRepository.delete({
        id: id,
        status: UserStatus.INACTIVE,
      });
      return result.affected;
    } catch (error) {
      console.log('Error fetching user data:', error);
      return null;
    }
  }
}
