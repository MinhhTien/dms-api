import { AppDataSource } from '../database/data-source';
import { singleton } from 'tsyringe';
import { LessThan, Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { BorrowRequest } from './entities/borrow_request.entity';
import { CreateBorrowRequestDto } from './dtos/create_borrow_request.dto';
import { Document } from '../documents/entities/document.entity';
import { DocumentStatus, RequestStatus } from '../constants/enum';
import { addDays, subtractDays } from '../lib/utils';
import { UUID } from 'lib/global.type';
import { RejectBorrowRequestDto } from './dtos/reject_borrow_request.dto';
import { FindBorrowRequestDto } from './dtos/find_borrow_request.dto';
import { uuidToBase64 } from '../lib/barcode';
import { BorrowHistory } from './entities/borrow_history.entity';

@singleton()
export class BorrowRequestService {
  private borrowRequestRepository: Repository<BorrowRequest>;
  private documentRepository: Repository<Document>;
  private borrowHistoryRepository: Repository<BorrowHistory>;

  constructor() {
    this.borrowRequestRepository = AppDataSource.getRepository(BorrowRequest);
    this.documentRepository = AppDataSource.getRepository(Document);
    this.borrowHistoryRepository = AppDataSource.getRepository(BorrowHistory);
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
      const borrowRequest = await this.borrowRequestRepository.findOne({
        where: {
          id: id,
          ...(createdBy && { createdBy: { id: createdBy } }),
        },
        relations: {
          document: {
            folder: {
              locker: {
                room: {
                  department: true,
                },
              },
            },
            category: true,
            createdBy: true,
            updatedBy: true,
          },
          createdBy: true,
          updatedBy: true,
        },
      });
      let data;
      if (borrowRequest?.status === RequestStatus.APPROVED && createdBy)
        data = { ...borrowRequest, qrcode: uuidToBase64(borrowRequest.id) };
      else if (borrowRequest?.document.status === DocumentStatus.BORROWED) {
        const borrowHistories = await this.borrowHistoryRepository.find({
          where: {
            document: {
              id: borrowRequest.document.id,
              status: DocumentStatus.BORROWED,
            },
          },
          order: {
            startDate: 'DESC',
          },
          relations: {
            user: true,
          },
        });
        console.log('borrowHistories:: ', borrowHistories);
        if (borrowHistories.length === 0) {
          return null;
        }

        const borrowHistory = borrowHistories[0];
        data = {
          ...borrowRequest,
          document: {
            ...borrowRequest.document,
            borrowedBy: borrowHistory.user,
          },
        };
      } else {
        data = borrowRequest;
      }
      return data;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  public async getMany(dto: FindBorrowRequestDto, createdBy?: UUID) {
    const take = dto.take || 10;
    const page = dto.page || 1;
    const skip = (page - 1) * take;
    try {
      const [result, total] = await this.borrowRequestRepository.findAndCount({
        where: {
          ...(dto.documentId && { document: { id: dto.documentId } }),
          ...(createdBy && { createdBy: { id: createdBy } }),
          ...(dto.status && { status: dto.status }),
        },
        relations: {
          document: {
            folder: {
              locker: {
                room: {
                  department: true,
                },
              },
            },
            category: true,
            createdBy: true,
            updatedBy: true,
          },
          createdBy: true,
          updatedBy: true,
        },
        order: {
          updatedAt: 'DESC',
          createdAt: 'DESC',
        },
        take: take,
        skip: skip,
      });
      return {
        data: createdBy
          ? result.map((borrowRequest: BorrowRequest) => {
              return {
                ...borrowRequest,
                ...(borrowRequest.status === RequestStatus.APPROVED && {
                  qrcode: uuidToBase64(borrowRequest.id),
                }),
              };
            })
          : result,
        total: total,
      };
    } catch (error) {
      console.log(error);
      return { data: [], total: 0 };
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
      result.document = document;
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
          createdBy: true,
          updatedBy: true,
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

  public async verify(id: UUID, updatedBy: User) {
    try {
      const borrowRequest = await this.borrowRequestRepository.findOne({
        where: {
          id: id,
          status: RequestStatus.APPROVED,
        },
        relations: {
          document: true,
          createdBy: true,
        },
      });

      if (!borrowRequest) {
        return 'Borrow Request not existed';
      }

      if (borrowRequest.document.status !== DocumentStatus.AVAILABLE)
        return 'Document is not available for borrowing';

      if (borrowRequest.startDate > new Date())
        return 'You just can verify this document to borrow since start date';

      if (
        addDays(borrowRequest.startDate, borrowRequest.borrowDuration) <
        new Date()
      )
        return (
          'You just can borrow this document within ' +
          borrowRequest.borrowDuration +
          ' days from start date'
        );

      borrowRequest.status = RequestStatus.DONE;
      borrowRequest.updatedBy = updatedBy;
      borrowRequest.document.status = DocumentStatus.BORROWED;

      const borrowHistory = await this.borrowHistoryRepository.create({
        document: borrowRequest.document,
        borrowRequest: borrowRequest,
        user: borrowRequest.createdBy,
        startDate: borrowRequest.startDate,
        dueDate: addDays(borrowRequest.startDate, borrowRequest.borrowDuration),
      });

      const [result, history] = await Promise.all([
        this.borrowRequestRepository.save(borrowRequest),
        this.borrowHistoryRepository.save(borrowHistory),
      ]);
      console.log('Verify borrow request:: ', result, history);
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
          createdBy: true,
          updatedBy: true,
        }
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
          createdBy: {
            id: updatedBy.id,
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

  public async updateExpired() {
    try {
      const updateExpiredPending = this.borrowRequestRepository.update(
        {
          status: RequestStatus.PENDING,
          expired_at: LessThan(new Date()),
        },
        {
          status: RequestStatus.EXPIRED,
        }
      );
      const updateExpiredApproved = this.borrowRequestRepository.update(
        {
          status: RequestStatus.APPROVED,
          updatedAt: LessThan(subtractDays(new Date(), 3)),
        },
        {
          status: RequestStatus.EXPIRED,
        }
      );
      return Promise.all([updateExpiredPending, updateExpiredApproved]);
    } catch (error) {
      console.log(error);
      return null;
    }
  }
}
