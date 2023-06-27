export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  DELETED = 'DELETED',
}

export enum DocumentStatus {
  REQUESTING = 'REQUESTING',
  PENDING = 'PENDING',
  AVAILABLE = 'AVAILABLE',
  BORROWED = 'BORROWED',
  DELETED = 'DELETED',
}

export enum RequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELED = 'CANCELED',
  DONE = 'DONE',
}
