import { Controller, Get, UseGuards, Res } from '@nestjs/common';
import { PrometheusController } from '@willsoto/nestjs-prometheus';
import { MonitoringGuard } from '../monitoring/monitoring.guard';
import { Response } from 'express';

@Controller('metrics')
@UseGuards(MonitoringGuard)
export class ProtectedMetricsController extends PrometheusController {
  @Get()
  async index(@Res() res: Response) {
    return super.index(res);
  }
}
