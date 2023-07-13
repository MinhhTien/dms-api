import { Locker } from './entities/locker.entity';
import { AppDataSource } from '../database/data-source';
import { UpdateLockerDto, CreateLockerDto } from './dtos/locker.dto';
import { UUID } from '../lib/global.type';
import { singleton } from 'tsyringe';
import { Repository } from 'typeorm';
import { Room } from '../rooms/entities/room.entity';

@singleton()
export class LockerService {
  private lockerRepository: Repository<Locker>;

  constructor() {
    this.lockerRepository = AppDataSource.getRepository(Locker);
  }

  public async getOne(id: UUID, departmentId?: UUID) {
    try {
      return departmentId
        ? await this.lockerRepository.findOne({
            where: {
              id: id,
              room: {
                department: {
                  id: departmentId,
                },
              },
            },
          })
        : await this.lockerRepository.findOne({
            where: {
              id: id,
            },
          });
    } catch (error) {
      console.log(error);
      return null;
    }
  }
  public async getMany(roomId: UUID, departmentId: UUID) {
    try {
      return departmentId
        ? await this.lockerRepository.find({
            where: {
              room: {
                id: roomId,
                department: {
                  id: departmentId,
                },
              },
            },
            order: { name: 'ASC' },
          })
        : await this.lockerRepository.find({
            where: {
              room: {
                id: roomId,
              },
            },
            order: { name: 'ASC' },
          });
    } catch (error) {
      console.log(error);
      return [];
    }
  }

  public async create(lockerDto: CreateLockerDto) {
    try {
      // check if room has enough capacity
      const room = await AppDataSource.getRepository(Room).findOne({
        where: {
          id: lockerDto.room.id,
        },
        relations: ['lockers'],
      });
      if (room) {
        if (room.lockers.length >= room.capacity) {
          return 'Room is full.';
        }
      } else {
        return 'Room not existed.';
      }

      const locker = this.lockerRepository.create(lockerDto);
      return await this.lockerRepository.save(locker);
    } catch (error: any) {
      console.log('====');
      console.error(error?.driverError?.detail);
      console.log('====');
      if (error?.driverError?.detail?.includes('already exists')) {
        return 'Locker name is already existed.';
      }
      return null;
    }
  }

  public async update(locker: UpdateLockerDto) {
    try {
      //check if locker is existed and capacity is not smaller than current number of folders
      const currentLocker = await this.lockerRepository.findOne({
        where: {
          id: locker.id,
        },
        relations: ['folders'],
      });
      if (currentLocker) {
        if (locker.capacity < currentLocker.folders.length) {
          return 'Capacity must greater or equal to current number of folders.';
        }
      }
      const result = await this.lockerRepository.update(
        {
          id: locker.id,
        },
        locker
      );
      return result.affected === 1;
    } catch (error: any) {
      console.log(error);
      console.log('====');
      console.error(error?.driverError?.detail);
      console.log('====');
      if (error?.driverError?.detail?.includes('already exists')) {
        return 'Locker name is already existed.';
      }
      return false;
    }
  }

  public async delete(id: string) {
    try {
      const result = await this.lockerRepository.delete({
        id: id,
      });
      return result.affected === 1;
    } catch (error: any) {
      console.log('====');
      console.error(error?.code);
      console.error(error?.driverError?.detail);
      console.log('====');
      if (error?.driverError?.detail?.includes('still referenced')) {
        return 'Locker already contains Folders';
      }
      return false;
    }
  }
}
