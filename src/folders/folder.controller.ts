import {
  Controller,
  Get,
  Route,
  Security,
  Tags,
  Path,
  Post,
  Body,
  Put,
  Delete,
  Response,
  Request,
  Query,
} from 'tsoa';
import { SuccessResponse, BadRequestError } from '../constants/response';
import type { UUID } from '../lib/global.type';
import { UpdateFolderDto, CreateFolderDto } from './dtos/folder.dto';
import { injectable } from 'tsyringe';
import { FolderService } from './folder.service';
import { Folder } from './entities/folder.entity';
import { uuidToBase64 } from '../lib/barcode';

@injectable()
@Tags('Folder')
@Route('folders')
export class FolderController extends Controller {
  constructor(private folderService: FolderService) {
    super();
  }

  /**
   * Retrieves a folder.
   * If user is EMPLOYEE, only get folder in own department.
   * @param id The id of folder
   */
  @Security('api_key', ['STAFF', 'EMPLOYEE'])
  @Get('/:id')
  @Response<Folder>(200)
  @Response<BadRequestError>(400)
  public async getOne(@Path() id: UUID, @Request() request: any) {
    const result = await this.folderService.getOne(
      id,
      request.user.role === 'EMPLOYEE' ? request.user.departmentId : undefined // if user is employee, only get folder of his department
    );
    if (result !== null) return new SuccessResponse('Success', result);
    else throw new BadRequestError('Folder not existed.');
  }

    /**
   * Retrieves folder QRcode.(STAFF only)
   * @param id The id of folder
   */
    @Security('api_key', ['STAFF'])
    @Get('/barcode/:id')
    @Response<Folder>(200)
    @Response<BadRequestError>(400)
    public async getBarcode(@Path() id: UUID, @Request() request: any) {
      const result = await this.folderService.getOne(id);
      if (result !== null)
        return new SuccessResponse('Success', {
          ...result,
          barcode: uuidToBase64(result.id),
        });
      else throw new BadRequestError('Folder not existed.');
    }

  /**
   * Retrieves folders of locker.
   * If user is EMPLOYEE, only get folders of locker in own department.
   * @param lockerId The id of locker
   */
  @Security('api_key', ['STAFF', 'EMPLOYEE'])
  @Get('')
  @Response<Folder[]>(200)
  public async getMany(@Request() request: any, @Query() lockerId: UUID) {
    return new SuccessResponse(
      'Success',
      await this.folderService.getMany(
        lockerId,
        request.user.role === 'EMPLOYEE' ? request.user.departmentId : undefined
      )
    );
  }

  /**
   * Create locker (STAFF only)
   */
  @Security('api_key', ['STAFF'])
  @Post('')
  public async create(@Body() body: CreateFolderDto) {
    const result = await this.folderService.create(body);
    if (result instanceof Folder) {
      return new SuccessResponse('Folder was created successfully.', result);
    }
    if (result == null)
      throw new BadRequestError('Folder could not be created.');
    else throw new BadRequestError(result);
  }

  /**
   * Update folder (STAFF only)
   */
  @Security('api_key', ['STAFF'])
  @Put('')
  public async update(@Body() body: UpdateFolderDto) {
    const result = await this.folderService.update(body);
    if (result === true) {
      return new SuccessResponse('Folder was updated successfully.', result);
    }
    if (result === false)
      throw new BadRequestError('Folder could not be updated.');
    else throw new BadRequestError(result);
  }

  /**
   * Delete folder (STAFF only)
   * If folder has documents, delete will be failed.
   * @param id The id of folder
   */
  @Security('api_key', ['STAFF'])
  @Delete('{id}')
  public async delete(@Path() id: UUID) {
    // need validate if folder has documents
    const result = await this.folderService.delete(id);
    if (result) {
      return new SuccessResponse('Folder was deleted successfully.', result);
    }
    throw new BadRequestError('Folder could not be deleted.');
  }
}
