import { Body, Controller, Get, Inject, Param, Post, Req, UseGuards } from '@nestjs/common';
import { SellerReviewDto, SubmitSellerOnboardingDto } from './dto';
import { AdminActionKeyGuard } from './admin-action-key.guard';
import { BearerAuthGuard } from './bearer-auth.guard';
import { SellerService } from './seller.service';

type AuthenticatedRequest = { user?: { id: string; email: string | null } };

@Controller()
export class SellerController {
  constructor(@Inject(SellerService) private readonly sellerService: SellerService) {}

  @UseGuards(BearerAuthGuard)
  @Post('seller/onboarding/submit')
  submit(@Req() request: AuthenticatedRequest, @Body() dto: SubmitSellerOnboardingDto) {
    return this.sellerService.submit(request.user!.id, dto);
  }

  @UseGuards(BearerAuthGuard)
  @Get('seller/me')
  me(@Req() request: AuthenticatedRequest) {
    return this.sellerService.getMine(request.user!.id);
  }

  @UseGuards(BearerAuthGuard)
  @Get('seller/dashboard')
  getDashboard(@Req() request: AuthenticatedRequest) {
    return this.sellerService.getDashboard(request.user!.id);
  }

  @UseGuards(BearerAuthGuard, AdminActionKeyGuard)
  @Post('admin/sellers/:id/verification/in-review')
  markInReview(@Req() request: AuthenticatedRequest, @Param('id') id: string, @Body() dto: SellerReviewDto) {
    return this.sellerService.review(id, 'IN_REVIEW', request.user?.id, dto.reason);
  }

  @UseGuards(BearerAuthGuard, AdminActionKeyGuard)
  @Post('admin/sellers/:id/verification/approve')
  approve(@Req() request: AuthenticatedRequest, @Param('id') id: string, @Body() dto: SellerReviewDto) {
    return this.sellerService.review(id, 'APPROVED', request.user?.id, dto.reason);
  }

  @UseGuards(BearerAuthGuard, AdminActionKeyGuard)
  @Post('admin/sellers/:id/verification/reject')
  reject(@Req() request: AuthenticatedRequest, @Param('id') id: string, @Body() dto: SellerReviewDto) {
    return this.sellerService.review(id, 'REJECTED', request.user?.id, dto.reason);
  }

  @UseGuards(BearerAuthGuard, AdminActionKeyGuard)
  @Post('admin/sellers/:id/verification/needs-more-info')
  needsMoreInfo(@Req() request: AuthenticatedRequest, @Param('id') id: string, @Body() dto: SellerReviewDto) {
    return this.sellerService.review(id, 'NEEDS_MORE_INFO', request.user?.id, dto.reason);
  }

  @UseGuards(BearerAuthGuard, AdminActionKeyGuard)
  @Post('admin/sellers/:id/verification/suspend')
  suspend(@Req() request: AuthenticatedRequest, @Param('id') id: string, @Body() dto: SellerReviewDto) {
    return this.sellerService.review(id, 'SUSPENDED', request.user?.id, dto.reason);
  }
}
