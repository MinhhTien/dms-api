import {
  Controller,
  Get,
  Route,
  Security,
  Tags,
  Request,
} from 'tsoa';
import { User } from './entities/user.entity';

@Route('users')
export class UsersController extends Controller {
  @Security('api_key', ['STAFF', 'EMPLOYEE'])
  @Tags('User')
  @Get('own')
  public getUser(
    @Request() request: any,
  ): User {
    console.log(request.user);
    return request.user;
  }
}
