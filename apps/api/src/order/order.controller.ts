import { Controller, Get, Post, Patch, Param, Body, UseGuards, Request, Query, ForbiddenException, Inject, forwardRef } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderStatus } from './order.state-machine';
import { BearerAuthGuard } from '../seller/bearer-auth.guard';
import { ApprovedSellerGuard } from '../seller/approved-seller.guard';
import { ShippingService } from '../shipping/shipping.service';

@Controller()
export class OrderController {
  constructor(
    @Inject(forwardRef(() => OrderService)) private readonly orderService: OrderService,
    @Inject(forwardRef(() => ShippingService)) private readonly shippingService: ShippingService,
  ) {}

  // --- BUYER ENDPOINTS ---

  @UseGuards(BearerAuthGuard)
  @Get('orders')
  async getMyOrders(@Request() req: any) {
    return this.orderService.getBuyerOrders(req.user.id);
  }

  @UseGuards(BearerAuthGuard)
  @Get('orders/:id')
  async getOrderDetails(@Param('id') id: string, @Request() req: any) {
    const order = await this.orderService.getOrderDetails(id);
    if (order.userId !== req.user.id && order.seller.userId !== req.user.id) {
      throw new ForbiddenException('You do not have access to this order');
    }
    return order;
  }

  @UseGuards(BearerAuthGuard)
  @Post('orders/:id/cancel')
  async cancelOrder(@Param('id') id: string, @Request() req: any) {
    return this.orderService.updateStatus(id, OrderStatus.CANCELLED, {
      id: req.user.id,
      role: 'BUYER'
    });
  }

  @UseGuards(BearerAuthGuard)
  @Post('orders/:id/return')
  async requestReturn(@Param('id') id: string, @Request() req: any) {
    return this.orderService.updateStatus(id, OrderStatus.RETURN_REQUESTED, {
      id: req.user.id,
      role: 'BUYER'
    });
  }

  // --- SELLER ENDPOINTS ---

  @UseGuards(BearerAuthGuard, ApprovedSellerGuard)
  @Get('seller/orders')
  async getSellerOrders(@Request() req: any) {
    return this.orderService.getSellerOrders(req.user.id); 
  }

  @UseGuards(BearerAuthGuard, ApprovedSellerGuard)
  @Patch('seller/orders/:id/status')
  async updateOrderStatus(
    @Param('id') id: string,
    @Body('status') status: OrderStatus,
    @Request() req: any
  ) {
    // If user has admin role, use ADMIN role, else SELLER
    const isAdmin = req.user.roles?.includes('admin');
    const role = isAdmin ? 'ADMIN' : 'SELLER';
    
    return this.orderService.updateStatus(id, status, {
      id: req.user.id,
      role
    });
  }

  @UseGuards(BearerAuthGuard, ApprovedSellerGuard)
  @Post('seller/orders/:id/ship')
  async shipOrder(
    @Param('id') id: string,
    @Body('trackingNumber') trackingNumber: string,
    @Body('carrier') carrier: string,
    @Request() req: any
  ) {
    // 1. Update Order Status to SHIPPED
    await this.orderService.updateStatus(id, OrderStatus.SHIPPED, {
      id: req.user.id,
      role: 'SELLER'
    });

    // 2. Create/Update Shipment
    return this.shippingService.markAsShipped(id, trackingNumber, carrier);
  }

  @UseGuards(BearerAuthGuard)
  @Get('orders/:id/shipment')
  async getShipment(@Param('id') id: string, @Request() req: any) {
    const order = await this.orderService.getOrderDetails(id);
    if (order.userId !== req.user.id && order.seller.userId !== req.user.id) {
      throw new ForbiddenException('You do not have access to this shipment info');
    }
    return this.shippingService.getShipmentByOrderId(id);
  }
}
