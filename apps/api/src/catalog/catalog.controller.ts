import { Body, Controller, Delete, Get, Inject, Param, Patch, Post, Query, UseGuards, Headers } from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { CreateCategoryDto, UpdateCategoryDto, CreateProductDto, UpdateProductDto, ProductFilterDto } from './dto';
import { BearerAuthGuard } from '../seller/bearer-auth.guard';
import { ApprovedSellerGuard } from '../seller/approved-seller.guard';

@Controller('catalog')
export class CatalogController {
  constructor(@Inject(CatalogService) private readonly catalogService: CatalogService) {}

  @Post('categories')
  createCategory(@Body() dto: CreateCategoryDto) {
    return this.catalogService.createCategory(dto);
  }

  @Patch('categories/:id')
  updateCategory(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.catalogService.updateCategory(id, dto);
  }

  @Get('categories/:id')
  getCategory(@Param('id') id: string) {
    return this.catalogService.getCategory(id);
  }

  @Get('categories')
  listCategories(@Query('tree') tree?: string, @Query('includeTranslations') includeTranslations?: string) {
    if (includeTranslations === 'true') {
      return this.catalogService.listCategories(tree === 'true');
    }
    return this.catalogService.listCategories(tree === 'true');
  }

  @Delete('categories/:id')
  deleteCategory(@Param('id') id: string) {
    return this.catalogService.deleteCategory(id);
  }

  @UseGuards(BearerAuthGuard, ApprovedSellerGuard)
  @Post('products')
  createProduct(@Body() dto: CreateProductDto) {
    return this.catalogService.createProduct(dto);
  }

  @UseGuards(BearerAuthGuard, ApprovedSellerGuard)
  @Patch('products/:id')
  updateProduct(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.catalogService.updateProduct(id, dto);
  }

  @Get('products/:id')
  async getProduct(@Param('id') id: string, @Query('lang') lang?: string, @Headers('accept-language') acceptLanguage?: string) {
    const product = await this.catalogService.getProduct(id);
    return this.localizeProduct(product, lang || acceptLanguage);
  }

  @Get('products')
  async listProducts(
    @Query() filter: ProductFilterDto,
    @Query('lang') lang?: string,
    @Query('includeTranslations') includeTranslations?: string,
    @Headers('accept-language') acceptLanguage?: string
  ) {
    // Manually ensure types for Prisma since query params are always strings in Express before ValidationPipe transform
    const sanitizedFilter = {
      ...filter,
      priceMin: filter.priceMin !== undefined ? Number(filter.priceMin) : undefined,
      priceMax: filter.priceMax !== undefined ? Number(filter.priceMax) : undefined,
      limit: filter.limit !== undefined ? Number(filter.limit) : undefined,
      offset: filter.offset !== undefined ? Number(filter.offset) : undefined,
    };
    const products = await this.catalogService.listProducts(sanitizedFilter);
    if (includeTranslations === 'true') {
      return products;
    }
    return products.map(p => this.localizeProduct(p, lang || acceptLanguage));
  }

  @UseGuards(BearerAuthGuard, ApprovedSellerGuard)
  @Delete('products/:id')
  deleteProduct(@Param('id') id: string) {
    return this.catalogService.deleteProduct(id);
  }

  private localizeProduct(product: any, langHeader?: string) {
    const locale = this.resolveLocale(langHeader);
    const translation = product.translations?.find((t: any) => t.locale === locale) || product.translations?.[0];
    
    const { translations, ...rest } = product;
    return {
      ...rest,
      title: translation?.title || 'No Title',
      slug: translation?.slug || 'no-slug',
      description: translation?.description || '',
    };
  }

  private resolveLocale(langHeader?: string): string {
    if (!langHeader) return 'en';
    if (langHeader.startsWith('de')) return 'de';
    return 'en';
  }
}
