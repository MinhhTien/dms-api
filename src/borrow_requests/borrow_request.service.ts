import { AppDataSource } from '../database/data-source';
import { singleton } from 'tsyringe';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { BorrowRequest } from './entities/borrow_request.entity';
import { CreateBorrowRequestDto } from './dtos/create_borrow_request.dto';
import { Document } from '../documents/entities/document.entity';
import { RequestStatus } from '../constants/enum';
import { addDays } from '../lib/utils';
import { UUID } from 'lib/global.type';
import { RejectBorrowRequestDto } from './dtos/reject_borrow_request.dto';

@singleton()
export class BorrowRequestService {
  private borrowRequestRepository: Repository<BorrowRequest>;
  private documentRepository: Repository<Document>;

  constructor() {
    this.borrowRequestRepository = AppDataSource.getRepository(BorrowRequest);
    this.documentRepository = AppDataSource.getRepository(Document);
  }

  validateBorrowRequest = (
    approvedRequests: BorrowRequest[],
    request: BorrowRequest | CreateBorrowRequestDto
  ) => {
    const approvedBorrowRequests = approvedRequests
      .filter((borrowRequest: BorrowRequest) => {
        return (
          borrowRequest.status === RequestStatus.APPROVED &&
          addDays(
            borrowRequest.startDate,
            borrowRequest.borrowDuration
          ).getDate() >= new Date().getDate()
        );
      })
      .sort((br1: BorrowRequest, br2: BorrowRequest) => {
        return br2.startDate.getTime() - br1.startDate.getTime();
      });
    if (approvedBorrowRequests.length > 0) {
      for (let i = 0; i < approvedBorrowRequests.length; i++) {
        if (
          approvedBorrowRequests[i].startDate <=
            addDays(request.startDate, request.borrowDuration) &&
          addDays(
            approvedBorrowRequests[i].startDate,
            approvedBorrowRequests[i].borrowDuration
          ) >= request.startDate
        ) {
          return false;
        }
      }
      return true;
    }
    return true;
  };

  public async getOne(id: UUID, createdBy?: UUID) {
    try {
      return createdBy
        ? await this.borrowRequestRepository.findOne({
            where: {
              id: id,
              createdBy: {
                id: createdBy,
              },
            },
          })
        : await this.borrowRequestRepository.findOne({
            where: {
              id: id,
            },
          });
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  public async getMany(documentId?: UUID, createdBy?: UUID) {
    try {
      return documentId
        ? await this.borrowRequestRepository.find({
            where: {
              document: {
                id: documentId,
              }
            },
          })
        : await this.borrowRequestRepository.find({
            where: {
              createdBy: {
                id: createdBy,
              }
            },
          });
    } catch (error) {
      console.log(error);
      return [];
    }
  }

  public async create(
    createBorrowRequestDto: CreateBorrowRequestDto,
    createdBy: User
  ) {
    try {
      const document = await this.documentRepository.findOne({
        where: {
          id: createBorrowRequestDto.document.id,
          folder: {
            locker: {
              room: {
                department: {
                  id: createdBy.department.id,
                },
              },
            },
          },
        },
        relations: {
          borrowRequests: true,
        },
      });
      if (!document) {
        return 'Document not existed';
      }
      if (
        !this.validateBorrowRequest(
          document.borrowRequests,
          createBorrowRequestDto
        )
      )
        return 'Request time is conflicted with other requests';

      const borrowRequest = this.borrowRequestRepository.create(
        createBorrowRequestDto
      );
      borrowRequest.createdBy = createdBy;
      const result = await this.borrowRequestRepository.save(borrowRequest);
      console.log(result);
      return result;
    } catch (error: any) {
      console.log('====');
      console.error(error?.driverError?.detail);
      console.log('====');
      return null;
    }
  }

  public async accept(id: UUID, updatedBy: User) {
    try {
      const borrowRequest = await this.borrowRequestRepository.findOne({
        where: {
          id: id,
          status: RequestStatus.PENDING,
        },
        relations: {
          document: {
            borrowRequests: true,
          },
        },
      });
      if (!borrowRequest) {
        return 'Borrow Request not existed';
      }
      if (
        !this.validateBorrowRequest(
          borrowRequest.document.borrowRequests,
          borrowRequest
        )
      )
        return 'Request time is conflicted with other requests';

      borrowRequest.status = RequestStatus.APPROVED;
      borrowRequest.updatedBy = updatedBy;
      const result = await this.borrowRequestRepository.save(borrowRequest);
      return result;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  public async reject(
    rejectBorrowRequestDto: RejectBorrowRequestDto,
    updatedBy: User
  ) {
    try {
      const borrowRequest = await this.borrowRequestRepository.findOne({
        where: {
          id: rejectBorrowRequestDto.id,
          status: RequestStatus.PENDING,
        },
        relations: {
          document: {
            borrowRequests: true,
          },
        },
      });
      if (!borrowRequest) {
        return 'Borrow Request not existed';
      }

      borrowRequest.rejectedReason = rejectBorrowRequestDto.rejectedReason;
      borrowRequest.status = RequestStatus.REJECTED;
      borrowRequest.updatedBy = updatedBy;
      const result = await this.borrowRequestRepository.save(borrowRequest);
      return result;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  public async cancel(id: UUID, updatedBy: User) {
    try {
      const borrowRequest = await this.borrowRequestRepository.findOne({
        where: {
          id: id,
          status: RequestStatus.PENDING,
        },
        relations: {
          document: {
            borrowRequests: true,
          },
        },
      });
      if (!borrowRequest) {
        return 'Borrow Request not existed';
      }

      borrowRequest.status = RequestStatus.CANCELED;
      borrowRequest.updatedBy = updatedBy;
      const result = await this.borrowRequestRepository.save(borrowRequest);
      return result;
    } catch (error) {
      console.log(error);
      return null;
    }
  }
}