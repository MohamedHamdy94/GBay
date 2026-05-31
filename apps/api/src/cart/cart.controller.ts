import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { CartService } from './cart.service';
import { CreateCartItemDto, UpdateCartItemDto } from './dto';
import { TokenService } from '../auth/token.service';
import { randomUUID } from 'crypto';

@Controller('cart')
export class CartController {
  constructor(
    @Inject(CartService) private readonly cartService: CartService,
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

  private getSessionToken(req: Request, res: Response): string {
    let sessionToken = req.cookies['gbay_session'];
    if (!sessionToken) {
      sessionToken = randomUUID();
      res.cookie('gbay_session', sessionToken, {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/',
      });
    }
    return sessionToken;
  }

  @Get()
  async getCart(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const userId = await this.getUserIdFromRequest(req);
    const sessionToken = this.getSessionToken(req, res);
    return this.cartService.getOrCreateCart(userId, sessionToken);
  }

  @Post('items')
  async addItem(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body() dto: CreateCartItemDto,
  ) {
    const userId = await this.getUserIdFromRequest(req);
    const sessionToken = this.getSessionToken(req, res);
    const cart = await this.cartService.getOrCreateCart(userId, sessionToken);
    return this.cartService.addItem(cart.id, dto);
  }

  @Patch('items/:id')
  async updateItem(@Param('id') id: string, @Body() dto: UpdateCartItemDto) {
    return this.cartService.updateItem(id, dto);
  }

  @Delete('items/:id')
  async removeItem(@Param('id') id: string) {
    return this.cartService.removeItem(id);
  }
}
