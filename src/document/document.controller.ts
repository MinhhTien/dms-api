import {
  Route,
  Post,
  Response,
  Controller,
  UploadedFile,
  Tags
} from 'tsoa';
import { SuccessResponse } from '../constants/response';

@Tags('Document')
@Route('documents')
export class DocumentController extends Controller {
  @Post('upload')
  @Response<SuccessResponse>(200)
  public async upload(
    @UploadedFile() file: Express.Multer.File
  ): Promise<any> {
    console.log(file)
    return new SuccessResponse('Successfully upload document', null);
  }
}
