import { Module } from '@nestjs/common';
import { MonitoringController } from './monitoring.controller';
import { MonitoringService } from './monitoring.service';
import { DatabaseModule } from '../../database.module';
import { SearchModule } from '../../search/search.module';
import { HealthModule } from '../health/health.module';

@Module({
  imports: [
    HealthModule,
    DatabaseModule,
    SearchModule,
  ],
  controllers: [MonitoringController],
  providers: [
    MonitoringService,
  ],
  exports: [MonitoringService],
})
export class MonitoringModule {}
