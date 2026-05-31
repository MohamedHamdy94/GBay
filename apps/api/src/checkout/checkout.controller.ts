import { Body, Controller, Get, Param, Post, Req, Res, Inject } from '@nestjs/common';
import { Request, Response } from 'express';
import { CheckoutService } from './checkout.service';
import { InitiateCheckoutDto, ConfirmCheckoutDto } from './dto';
import { TokenService } from '../auth/token.service';

@Controller('checkout')
export class CheckoutController {
  constructor(
    @Inject(CheckoutService) private readonly checkoutService: CheckoutService,
    @Inject(TokenService) private readonly tokenService: TokenService,
  ) {}

  private async getUserIdFromRequest(req: Request): Promise<string | undefined> {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const payload = this.tokenService.verifyAccessToken(token);
        return payload.sub;
      } catch (e) {
        return undefined;
      }
    }
    return undefined;
  }

  @Post('initiate')
  async initiate(
    @Req() req: Request,
    @Body() dto: InitiateCheckoutDto,
  ) {
    const userId = await this.getUserIdFromRequest(req);
    const sessionToken = req.cookies['gbay_session'];
    return this.checkoutService.initiateCheckout(userId, sessionToken, dto);
  }

  @Post('confirm')
  async confirm(
    @Req() req: Request,
    @Body() dto: ConfirmCheckoutDto,
  ) {
    const userId = await this.getUserIdFromRequest(req);
    return this.checkoutService.confirmCheckout(userId, dto.checkoutSessionId);
  }

  @Get(':id')
  async getSession(@Param('id') id: string) {
    return this.checkoutService.getSession(id);
  }
}
