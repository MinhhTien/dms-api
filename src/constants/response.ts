export class SuccessResponse {
  message: string
  data: any
  constructor(message: string, data: any) {
    this.message = message;
    this.data = data;
  }
}
export class BadRequestError extends Error {
  details: any
  constructor(message: string, details = null) {
    super(message);
    this.name = this.constructor.name;
    this.details = details;
  }
}
export class UnauthorizedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}
export class ForbiddenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}