import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@gbay/database';
import {
  CatalogRepository,
  CategoryView,
  CreateCategoryInput,
  UpdateCategoryInput,
  ProductView,
  CreateProductInput,
  UpdateProductInput,
  ProductFilterInput,
} from './catalog.types';

@Injectable()
export class PrismaCatalogRepository implements CatalogRepository {
  private readonly prisma = new PrismaClient();

  async createCategory(input: CreateCategoryInput): Promise<CategoryView> {
    return this.prisma.category.create({
      data: {
        parentId: input.parentId,
        key: input.key,
        sortOrder: input.sortOrder ?? 0,
        translations: {
          create: input.translations,
        },
      },
      include: {
        translations: true,
      },
    }) as unknown as Promise<CategoryView>;
  }

  async updateCategory(id: string, input: UpdateCategoryInput): Promise<CategoryView> {
    return this.prisma.$transaction(async (tx) => {
      if (input.translations) {
        await tx.categoryTranslation.deleteMany({
          where: { categoryId: id },
        });
        await tx.categoryTranslation.createMany({
          data: input.translations.map((t) => ({ ...t, categoryId: id })),
        });
      }

      const updated = await tx.category.update({
        where: { id },
        data: {
          parentId: input.parentId,
          key: input.key,
          sortOrder: input.sortOrder,
        },
        include: {
          translations: true,
        },
      });

      return updated as unknown as CategoryView;
    });
  }

  async findCategoryById(id: string): Promise<CategoryView | null> {
    return this.prisma.category.findUnique({
      where: { id },
      include: { translations: true },
    }) as unknown as Promise<CategoryView | null>;
  }

  async findCategoryByKey(key: string): Promise<CategoryView | null> {
    return this.prisma.category.findUnique({
      where: { key },
      include: { translations: true },
    }) as unknown as Promise<CategoryView | null>;
  }

  async listCategories(tree = false): Promise<CategoryView[]> {
    if (tree) {
      const all = await this.prisma.category.findMany({
        include: { translations: true },
        orderBy: { sortOrder: 'asc' },
      });
      
      const map = new Map<string, any>();
      all.forEach(c => map.set(c.id, { ...c, children: [] }));
      
      const roots: any[] = [];
      all.forEach(c => {
        if (c.parentId && map.has(c.parentId)) {
          map.get(c.parentId).children.push(map.get(c.id));
        } else {
          roots.push(map.get(c.id));
        }
      });
      return roots;
    }

    return this.prisma.category.findMany({
      include: { translations: true },
      orderBy: { sortOrder: 'asc' },
    }) as unknown as Promise<CategoryView[]>;
  }

  async deleteCategory(id: string): Promise<void> {
    await this.prisma.category.delete({ where: { id } });
  }

  async createProduct(input: CreateProductInput): Promise<ProductView> {
    const listingType = input.listing?.type || 'BUY_NOW';
    
    return this.prisma.product.create({
      data: {
        sellerId: input.sellerId,
        sellerUserId: input.sellerUserId,
        sku: input.sku,
        categoryId: input.categoryId,
        brand: input.brand,
        condition: input.condition,
        translations: {
          create: input.translations,
        },
        media: input.media ? {
          create: input.media,
        } : undefined,
        listings: input.listing ? {
          create: {
            sellerId: input.sellerId,
            status: 'ACTIVE',
            type: listingType,
            buyNowPriceCents: input.listing.buyNowPriceCents,
            quantityTotal: input.listing.quantityTotal ?? 1,
            quantityAvailable: input.listing.quantityTotal ?? 1,
            auction: listingType === 'AUCTION' ? {
              create: {
                sellerId: input.sellerId,
                startPriceCents: input.listing.startingBidCents || 100,
                reservePriceCents: input.listing.reservePriceCents,
                minBidIncrementCents: input.listing.minBidIncrementCents || 100,
                startTime: new Date(),
                endTime: new Date(Date.now() + (input.listing.auctionDurationDays || 7) * 24 * 60 * 60 * 1000),
                status: 'ACTIVE',
              }
            } : undefined,
          }
        } : undefined,
      },
      include: {
        translations: true,
        media: true,
        listings: {
          include: {
            auction: true,
          }
        },
      },
    }) as unknown as Promise<ProductView>;
  }

  async updateProduct(id: string, input: UpdateProductInput): Promise<ProductView> {
    return this.prisma.$transaction(async (tx) => {
      if (input.translations) {
        await tx.productTranslation.deleteMany({
          where: { productId: id },
        });
        await tx.productTranslation.createMany({
          data: input.translations.map((t) => ({ ...t, productId: id })),
        });
      }

      if (input.media) {
        await tx.mediaAsset.deleteMany({
          where: { productId: id },
        });
        await tx.mediaAsset.createMany({
          data: input.media.map((m) => ({ ...m, productId: id })),
        });
      }

      const updated = await tx.product.update({
        where: { id },
        data: {
          sku: input.sku,
          categoryId: input.categoryId,
          brand: input.brand,
          condition: input.condition,
          status: input.status as any,
        },
        include: {
          translations: true,
          media: true,
          listings: true,
        },
      });

      return updated as unknown as ProductView;
    });
  }

  async findProductById(id: string): Promise<ProductView | null> {
    return this.prisma.product.findUnique({
      where: { id },
      include: { translations: true, media: true, listings: true },
    }) as unknown as Promise<ProductView | null>;
  }

  async listProductsBySeller(sellerId: string): Promise<ProductView[]> {
    return this.prisma.product.findMany({
      where: { sellerId },
      include: { translations: true, media: true, listings: true },
    }) as unknown as Promise<ProductView[]>;
  }

  async listProducts(filter: ProductFilterInput): Promise<ProductView[]> {
    const where: any = {
      status: filter.status ?? 'ACTIVE',
    };

    if (filter.categoryId) {
      where.categoryId = filter.categoryId;
    }

    if (filter.condition) {
      where.condition = filter.condition;
    }

    if (filter.priceMin !== undefined || filter.priceMax !== undefined) {
      where.listings = {
        some: {
          status: 'ACTIVE',
          buyNowPriceCents: {
            gte: filter.priceMin,
            lte: filter.priceMax,
          },
        },
      };
    }

    return this.prisma.product.findMany({
      where,
      include: { translations: true, media: true, listings: true },
      take: filter.limit ?? 20,
      skip: filter.offset ?? 0,
      orderBy: { createdAt: 'desc' },
    }) as unknown as Promise<ProductView[]>;
  }

  async deleteProduct(id: string): Promise<void> {
    await this.prisma.product.delete({ where: { id } });
  }
}
