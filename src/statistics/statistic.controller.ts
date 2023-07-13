import { DocumentStatus } from '../constants/enum';
import { Controller, Get, Path, Request, Route, Security, Tags } from 'tsoa';
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

  /**
   * Import Statistic By Department.(STAFF only)
   */
  @Security('api_key', ['STAFF'])
  @Get('import')
  public async importStatisticByDepartment() {
    const result = await this.statisticService.statisticByDepartment(
      DocumentStatus.AVAILABLE
    );
    return new SuccessResponse('Success', result);
  }

  /**
   * Borrow Statistic By Department.(STAFF only)
   */
  @Security('api_key', ['STAFF'])
  @Get('borrow')
  public async borrowStatisticByDepartment() {
    const result = await this.statisticService.statisticByDepartment(
      DocumentStatus.BORROWED
    );
    return new SuccessResponse('Success', result);
  }

  /**
   * Document Summary.
   * if Employee, return summary of his department.
   */
  @Security('api_key', ['STAFF', 'EMPLOYEE'])
  @Get('document-summary')
  public async documentSummary(@Request() request: any) {
    const result = await this.statisticService.documentSummary(request.user.role.name === 'EMPLOYEE'
    ? request.user.department.id
    : undefined);
    return new SuccessResponse('Success', result);
  }

  /**
   * Space Summary.
   * if Employee, return summary space of his department.
   */
  @Security('api_key', ['STAFF', 'EMPLOYEE'])
  @Get('space-summary')
  public async documentSpace(@Request() request: any) {
    const result = await this.statisticService.documentSpace(request.user.role.name === 'EMPLOYEE'
    ? request.user.department.id
    : undefined);
    return new SuccessResponse('Success', result);
  }

  /**
   * Import request report.
   * if Employee, Import request report of his department.
   * @param year Year of report.
   */
  @Security('api_key', ['STAFF', 'EMPLOYEE'])
  @Get('status-import-request/:year')
  public async importRequestReport(@Path() year: number, @Request() request: any) {
    const result = await this.statisticService.importRequestReport(year, request.user.role.name === 'EMPLOYEE'
    ? request.user.department.id
    : undefined);
    return new SuccessResponse('Success', result);
  }

  /**
   * Borrow request report.
   * if Employee, Borrow request report of his department.
   * @param year Year of report.
   */
  @Security('api_key', ['STAFF', 'EMPLOYEE'])
  @Get('status-borrow-request/:year')
  public async borrowRequestReport(@Path() year: number, @Request() request: any) {
    const result = await this.statisticService.borrowRequestReport(year, request.user.role.name === 'EMPLOYEE'
    ? request.user.department.id
    : undefined);
    return new SuccessResponse('Success', result);
  }
}
