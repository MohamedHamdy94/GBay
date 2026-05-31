import { CanActivate, ExecutionContext, Injectable, ForbiddenException, Inject } from '@nestjs/common';
import { SellerService } from './seller.service';

@Injectable()
export class ApprovedSellerGuard implements CanActivate {
  constructor(@Inject(SellerService) private readonly sellerService: SellerService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return false;
    }

    try {
      const seller = await this.sellerService.getMine(user.id);
      if (seller.status !== 'APPROVED') {
        throw new ForbiddenException({
          code: 'SELLER_NOT_APPROVED',
          message: 'Seller account is not approved',
          status: seller.status 
        });
      }
      request.seller = seller;
      return true;
    } catch (e) {
      if (e instanceof ForbiddenException) throw e;
      throw new ForbiddenException({
        code: 'SELLER_PROFILE_REQUIRED',
        message: 'Seller profile is required to access this resource'
      });
    }
  }
}
