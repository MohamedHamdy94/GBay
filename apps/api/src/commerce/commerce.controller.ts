import { Body, Controller, Get, Param, Post, UseGuards, Request, Inject } from '@nestjs/common';
import { CommerceService } from './commerce.service';
import { ReserveItemDto } from './dto';
import { BearerAuthGuard } from '../seller/bearer-auth.guard';

@Controller('commerce')
export class CommerceController {
  constructor(@Inject(CommerceService) private readonly commerceService: CommerceService) {}

  @Post('reserve')
  @UseGuards(BearerAuthGuard)
  async reserve(@Body() dto: ReserveItemDto, @Request() req: any) {
    return this.commerceService.reserveItem({
      ...dto,
      userId: req.user.id,
    });
  }

  @Get('reservations/:id')
  @UseGuards(BearerAuthGuard)
  async getReservation(@Param('id') id: string) {
    return this.commerceService.getReservation(id);
  }
}
