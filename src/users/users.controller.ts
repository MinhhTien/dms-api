import {
  Controller,
  Get,
  Route,
  Security,
  Tags,
  Request,
} from 'tsoa';
import { User } from './entities/user.entity';
import { SuccessResponse, BadRequestError } from '../constants/response';

@Tags('User')
@Route('users')
export class UsersController extends Controller {
  @Security('api_key', ['STAFF', 'EMPLOYEE'])
  @Get('own')
  public getUser(
    @Request() request: any,
  ): User {
    return request.user;
  }
  @Security('api_key', ['STAFF', 'EMPLOYEE'])
  @Get('login')
  public login(
    @Request() request: any,
  ): SuccessResponse | BadRequestError {
    if(request.user) return new SuccessResponse('Login success', null);
    else return new BadRequestError('Login fail');
  }
}
