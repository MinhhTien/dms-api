import { Room } from './entities/room.entity';
import { AppDataSource } from '../database/data-source';
import { UpdateRoomDto, CreateRoomDto } from './dtos/room.dto';
import { UUID } from '../lib/global.type';
import { singleton } from 'tsyringe';
import { Repository } from 'typeorm';

@singleton()
export class RoomService {
  private roomRepository: Repository<Room>;

  constructor() {
    this.roomRepository = AppDataSource.getRepository(Room);
  }

  public async getOne(id: UUID, departmentId?: UUID) {
    try {
      return departmentId
        ? await this.roomRepository.findOne({
            where: {
              id: id,
              department: {
                id: departmentId,
              },
            },
          })
        : await this.roomRepository.findOne({
            where: {
              id: id,
            },
          });
    } catch (error) {
      console.log(error);
      return null;
    }
  }
  public async getAll(departmentId?: UUID) {
    try {
      return departmentId
        ? await this.roomRepository.find({
            where: {
              department: {
                id: departmentId,
              },
            },
          })
        : await this.roomRepository.find();
    } catch (error) {
      console.log(error);
      return [];
    }
  }

  public async create(roomDto: CreateRoomDto) {
    try {
      const room = this.roomRepository.create(roomDto);
      return await this.roomRepository.save(room);
    } catch (error: any) {
      console.log('====');
      console.error(error?.driverError?.detail);
      console.log('====');
      if (error?.driverError?.detail?.includes('already exists')) {
        return 'Room name is already existed.';
      }
      if (error?.driverError?.detail?.includes('is not present')) {
        return 'Department is not existed.';
      }
      return null;
    }
  }

  public async update(room: UpdateRoomDto) {
    try {
      //check if room is existed and capacity is not smaller than current number of lockers
      const currentRoom = await this.roomRepository.findOne({
        where: {
          id: room.id,
        },
        relations: ['lockers'],
      });
      if (currentRoom) {
        if (room.capacity < currentRoom.lockers.length) {
          return 'Capacity must greater or equal to current number of lockers.';
        }
      }
      const result = await this.roomRepository.update(
        {
          id: room.id,
        },
        room
      );
      return result.affected === 1;
    } catch (error: any) {
      console.log('====');
      console.error(error?.driverError?.detail);
      console.log('====');
      if (error?.driverError?.detail?.includes('already exists')) {
        return 'Room name is already existed.';
      }
      return false;
    }
  }

  public async delete(id: string) {
    try {
      const result = await this.roomRepository.delete({
        id: id,
      });
      return result.affected === 1;
    } catch (error: any) {
      console.log('====');
      console.error(error?.code);
      console.error(error?.driverError?.detail);
      console.log('====');
      if (error?.driverError?.detail?.includes('still referenced')) {
        return 'Room already contains Lockers';
      }
      return false;
    }
  }
}
