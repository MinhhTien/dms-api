import {
  Controller,
  Get,
  Route,
  Security,
  Tags,
  Request,
  Path,
  Post,
  Body,
  Response,
} from 'tsoa';
import { User } from './entities/user.entity';
import { SuccessResponse, BadRequestError } from '../constants/response';
import { injectable } from 'tsyringe';
import { UsersService } from './users.service';
import { UUID } from '../lib/global.type';
import { redisClient } from '../index';
import { UserRecord, getAuth } from 'firebase-admin/auth';
import { CreateUserDto } from './dtos/create-user.dto';

@injectable()
@Tags('User')
@Route('users')
export class UsersController extends Controller {
  constructor(private userService: UsersService) {
    super();
  }

  /**
   * Retrieve own user information
   */
  @Security('api_key', ['STAFF', 'EMPLOYEE'])
  @Get('own')
  public getUser(@Request() request: any): User {
    return request.user;
  }

  /**
   * Login
   */
  @Security('api_key', ['STAFF', 'EMPLOYEE'])
  @Get('login')
  public login(@Request() request: any): SuccessResponse | BadRequestError {
    if (request.user) return new SuccessResponse('Login success', null);
    else return new BadRequestError('Login fail');
  }

  /**
   * Logout
   */
  @Security('api_key', ['STAFF', 'EMPLOYEE'])
  @Get('logout')
  public async logout(
    @Request() request: any
  ): Promise<SuccessResponse | BadRequestError> {
    const userRecord: UserRecord = await getAuth().getUserByEmail(
      request.user.email
    );
    const result = await redisClient.del(userRecord.uid);
    if (result) return new SuccessResponse('Logout success', null);
    else return new BadRequestError('Logout fail');
  }

  /**
   * Count members
   * if EMPLOYEE, count all members in own department
   */
  @Security('api_key', ['STAFF', 'EMPLOYEE'])
  @Get('count')
  @Response<number>(200)
  public async count(@Request() request: any) {
    return new SuccessResponse(
      'Success',
      await this.userService.count(
        request.user.role.name === 'EMPLOYEE'
          ? request.user.department.id
          : undefined
      )
    );
  }

  /**
   * Get user profile
   */
  @Security('api_key', ['STAFF', 'EMPLOYEE'])
  @Get('profile/:id')
  public async getProfile(@Path() id: UUID) {
    const result = await this.userService.getProfile(id);
    if (result !== null) return new SuccessResponse('Success', result);
    else return new BadRequestError('Fail to get profile');
  }

  /**
   * Revoke refresh token
   */
  @Security('api_key', ['STAFF', 'EMPLOYEE'])
  @Post('revoke-refresh-token')
  public async revokeRefreshToken(@Request() request: any) {
    const result = await this.userService.revokeRefreshToken(
      request.user.email
    );
    if (result) return new SuccessResponse('Success', result);
    else return new BadRequestError('Fail to revoke refresh token');
  }

  /**
   * Create new employee account (STAFF only)
   */
  @Security('api_key', ['STAFF'])
  @Post('new')
  public async create(@Body() createUserDto: CreateUserDto) {
    const result = await this.userService.create(createUserDto);
    if (result instanceof User) {
      return new SuccessResponse('Success', result);
    }
    if (result == null)
      throw new BadRequestError('Fail to create new account.');
    else throw new BadRequestError(result);
  }

  /**
   * Disable account (STAFF only)
   * @param id id of employee
   */
  @Security('api_key', ['STAFF'])
  @Post('disable/:id')
  public async disable(@Path() id: UUID) {
    const result = await this.userService.disable(id);
    if (result) return new SuccessResponse('Success', null);
    else return new BadRequestError('Fail to disable account.');
  }

  /**
   * Enable account (STAFF only)
   * @param id id of employee
   */
  @Security('api_key', ['STAFF'])
  @Post('enable/:id')
  public async enable(@Path() id: UUID) {
    const result = await this.userService.enable(id);
    if (result) return new SuccessResponse('Success', null);
    else return new BadRequestError('Fail to enable account.');
  }

  /**
   * Delete account (STAFF only)
   * @param id id of employee
   */
  @Security('api_key', ['STAFF'])
  @Post('delete/:id')
  public async delete(@Path() id: UUID) {
    const result = await this.userService.delete(id);
    if (result) return new SuccessResponse('Success', null);
    else return new BadRequestError('Fail to delete account.');
  }
}
