import { Body, Controller, Get, Inject, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { BearerAuthGuard } from '../seller/bearer-auth.guard';
import { AdminGuard } from './admin.guard';
import { 
  UserSearchQueryDto, 
  SellerSearchQueryDto, 
  ListingSearchQueryDto, 
  AuctionSearchQueryDto, 
  OrderSearchQueryDto, 
  DisputeSearchQueryDto, 
  RefundSearchQueryDto, 
  AuditLogSearchQueryDto, 
  UpdateUserStatusDto, 
  UpdateSellerStatusDto, 
  UpdateListingStatusDto, 
  ResolveDisputeDto, 
  UpdateFeatureFlagDto
} from './dto';

import { Throttle } from '@nestjs/throttler';

@Controller('admin')
@UseGuards(BearerAuthGuard, AdminGuard)
@Throttle({ medium: { limit: 30, ttl: 60000 } })
export class AdminController {
  constructor(@Inject(AdminService) private readonly adminService: AdminService) {
    console.log('AdminController constructor called');
    console.log('AdminService injected:', !!this.adminService);
  }

  @Get('dashboard')
  getDashboardMetrics() {
    console.log('AdminController.getDashboardMetrics called');
    if (!this.adminService) {
      console.error('CRITICAL: adminService is undefined in getDashboardMetrics');
      throw new Error('Internal Server Error: adminService undefined');
    }
    return this.adminService.getDashboardMetrics();
  }

  @Get('users')
  listUsers(@Query() query: UserSearchQueryDto) {
    return this.adminService.listUsers(query);
  }

  @Get('users/:id')
  getUser(@Param('id') id: string) {
    return this.adminService.getUser(id);
  }

  @Patch('users/:id/status')
  updateUserStatus(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateUserStatusDto) {
    return this.adminService.updateUserStatus(req.user.id, id, dto);
  }

  @Get('sellers')
  listSellers(@Query() query: SellerSearchQueryDto) {
    return this.adminService.listSellers(query);
  }

  @Get('sellers/:id')
  getSeller(@Param('id') id: string) {
    return this.adminService.getSeller(id);
  }

  @Patch('sellers/:id/status')
  updateSellerStatus(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateSellerStatusDto) {
    return this.adminService.updateSellerStatus(req.user.id, id, dto);
  }

  @Get('listings')
  listListings(@Query() query: ListingSearchQueryDto) {
    return this.adminService.listListings(query);
  }

  @Get('listings/:id')
  getListing(@Param('id') id: string) {
    return this.adminService.getListing(id);
  }

  @Patch('listings/:id/status')
  updateListingStatus(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateListingStatusDto) {
    return this.adminService.updateListingStatus(req.user.id, id, dto);
  }

  @Get('auctions')
  listAuctions(@Query() query: AuctionSearchQueryDto) {
    return this.adminService.listAuctions(query);
  }

  @Get('auctions/:id')
  getAuction(@Param('id') id: string) {
    return this.adminService.getAuction(id);
  }

  @Patch('auctions/:id/cancel')
  cancelAuction(@Req() req: any, @Param('id') id: string, @Body('reason') reason: string) {
    return this.adminService.cancelAuction(req.user.id, id, reason);
  }

  @Get('orders')
  listOrders(@Query() query: OrderSearchQueryDto) {
    return this.adminService.listOrders(query);
  }

  @Get('disputes')
  listDisputes(@Query() query: DisputeSearchQueryDto) {
    return this.adminService.listDisputes(query);
  }

  @Get('disputes/:id')
  getDispute(@Param('id') id: string) {
    return this.adminService.getDispute(id);
  }

  @Patch('disputes/:id/review')
  reviewDispute(@Req() req: any, @Param('id') id: string) {
    return this.adminService.updateDisputeStatus(req.user.id, id, 'UNDER_REVIEW', 'Admin started review');
  }

  @Patch('disputes/:id/resolve')
  resolveDispute(@Req() req: any, @Param('id') id: string, @Body() dto: ResolveDisputeDto) {
    return this.adminService.resolveDispute(req.user.id, id, dto);
  }

  @Get('refunds')
  listRefunds(@Query() query: RefundSearchQueryDto) {
    return this.adminService.listRefunds(query);
  }

  @Get('commissions')
  getCommissions() {
    return this.adminService.getCommissions();
  }

  @Get('audit-log')
  listAuditLogs(@Query() query: AuditLogSearchQueryDto) {
    return this.adminService.listAuditLogs(query);
  }

  @Get('feature-flags')
  getFeatureFlags() {
    return this.adminService.getFeatureFlags();
  }

  @Patch('feature-flags/:name')
  updateFeatureFlag(@Req() req: any, @Param('name') name: string, @Body() dto: UpdateFeatureFlagDto) {
    return this.adminService.updateFeatureFlag(req.user.id, name, dto.enabled);
  }
}
