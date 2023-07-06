import { DocumentStatus } from '../constants/enum';
import { Controller, Get, Route, Security, Tags } from 'tsoa';
import { injectable } from 'tsyringe';
import { StatisticService } from './statistic.service';
import { SuccessResponse } from '../constants/response';

@injectable()
@Tags('Statistics')
@Route('statistics')
export class StatisticController extends Controller {
  constructor(private statisticService: StatisticService) {
    super();
  }

  @Security('api_key', ['STAFF'])
  @Get('/import')
  public async importStatisticByDepartment() {
    const result = await this.statisticService.statisticByDepartment(
      DocumentStatus.AVAILABLE
    );
    return new SuccessResponse('Success', result);
  }

  @Security('api_key', ['STAFF'])
  @Get('/borrow')
  public async borrowStatisticByDepartment() {
    const result = await this.statisticService.statisticByDepartment(
      DocumentStatus.BORROWED
    );
    return new SuccessResponse('Success', result);
  }
}
