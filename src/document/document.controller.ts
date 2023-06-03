import {
  Route,
  Post,
  Response,
  Controller,
  UploadedFile,
  Tags,
  Body,
  Security,
} from 'tsoa';
import { SuccessResponse } from '../constants/response';

@Tags('Document')
@Route('documents')
export class DocumentController extends Controller {
  @Post('')
  @Security('api_key', ['STAFF'])
  @Response<SuccessResponse>(200)
  public async upload(
    @Body() body: any,
    @UploadedFile() file: Express.Multer.File
  ): Promise<any> {
    // service handle create new document
    return new SuccessResponse('Successfully upload document', null);
  }
}
