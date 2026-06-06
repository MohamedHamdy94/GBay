import { randomUUID } from 'node:crypto';
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

export class InMemoryCatalogRepository implements CatalogRepository {
  private readonly categories = new Map<string, CategoryView>();
  private readonly products = new Map<string, ProductView>();

  async createCategory(input: CreateCategoryInput): Promise<CategoryView> {
    const now = new Date();
    const category: CategoryView = {
      id: randomUUID(),
      parentId: input.parentId ?? null,
      key: input.key,
      sortOrder: input.sortOrder ?? 0,
      translations: input.translations as any,
      createdAt: now,
    };
    this.categories.set(category.id, category);
    return category;
  }

  async updateCategory(id: string, input: UpdateCategoryInput): Promise<CategoryView> {
    const existing = this.categories.get(id);
    if (!existing) throw new Error('CATEGORY_NOT_FOUND');
    const updated: CategoryView = {
      ...existing,
      parentId: input.parentId !== undefined ? input.parentId : existing.parentId,
      key: input.key ?? existing.key,
      sortOrder: input.sortOrder ?? existing.sortOrder,
      translations: (input.translations as any) ?? existing.translations,
    };
    this.categories.set(id, updated);
    return updated;
  }

  async findCategoryById(id: string): Promise<CategoryView | null> {
    return this.categories.get(id) ?? null;
  }

  async findCategoryByKey(key: string): Promise<CategoryView | null> {
    return [...this.categories.values()].find((c) => c.key === key) ?? null;
  }

  async listCategories(tree = false): Promise<CategoryView[]> {
    const all = [...this.categories.values()];
    if (tree) {
      const map = new Map<string, any>();
      all.forEach((c) => map.set(c.id, { ...c, children: [] }));
      const roots: any[] = [];
      all.forEach((c) => {
        if (c.parentId && map.has(c.parentId)) {
          map.get(c.parentId).children.push(map.get(c.id));
        } else {
          roots.push(map.get(c.id));
        }
      });
      return roots;
    }
    return all;
  }

  async deleteCategory(id: string): Promise<void> {
    this.categories.delete(id);
  }

  async createProduct(input: CreateProductInput): Promise<ProductView> {
    const now = new Date();
    const listingType = input.listing?.type || 'BUY_NOW';
    
    const product: ProductView = {
      id: randomUUID(),
      sellerId: input.sellerId,
      sellerUserId: input.sellerUserId ?? null,
      sku: input.sku ?? null,
      status: 'ACTIVE',
      categoryId: input.categoryId ?? null,
      brand: input.brand ?? null,
      condition: input.condition,
      translations: input.translations as any,
      media: input.media?.map(m => ({ id: randomUUID(), ...m })) as any,
      listings: input.listing ? [{
        id: randomUUID(),
        type: listingType as any,
        buyNowPriceCents: input.listing.buyNowPriceCents ?? null,
        quantityTotal: input.listing.quantityTotal ?? 1,
        quantityAvailable: input.listing.quantityTotal ?? 1,
        auction: listingType === 'AUCTION' ? {
          id: randomUUID(),
          sellerId: input.sellerId,
          startPriceCents: input.listing.startingBidCents || 100,
          reservePriceCents: input.listing.reservePriceCents ?? null,
          minBidIncrementCents: input.listing.minBidIncrementCents || 100,
          startTime: now,
          endTime: new Date(now.getTime() + (input.listing.auctionDurationDays || 7) * 24 * 60 * 60 * 1000),
          status: 'ACTIVE',
        } : undefined,
      }] as any : [],
      createdAt: now,
      updatedAt: now,
    };
    this.products.set(product.id, product);
    return product;
  }

  async updateProduct(id: string, input: UpdateProductInput): Promise<ProductView> {
    const existing = this.products.get(id);
    if (!existing) throw new Error('PRODUCT_NOT_FOUND');
    const updated: ProductView = {
      ...existing,
      sku: input.sku ?? existing.sku,
      categoryId: input.categoryId !== undefined ? input.categoryId : existing.categoryId,
      brand: input.brand ?? existing.brand,
      condition: input.condition ?? existing.condition,
      status: input.status ?? existing.status,
      translations: (input.translations as any) ?? existing.translations,
      media: input.media ? input.media.map(m => ({ id: randomUUID(), ...m })) as any : existing.media,
      updatedAt: new Date(),
    };
    this.products.set(id, updated);
    return updated;
  }

  async findProductById(id: string): Promise<ProductView | null> {
    return this.products.get(id) ?? null;
  }

  async listProductsBySeller(sellerId: string): Promise<ProductView[]> {
    return [...this.products.values()].filter((p) => p.sellerId === sellerId);
  }

  async listProducts(filter: ProductFilterInput): Promise<ProductView[]> {
    let all = [...this.products.values()];
    
    if (filter.status) {
      all = all.filter(p => p.status === filter.status);
    } else {
      all = all.filter(p => p.status === 'ACTIVE');
    }

    if (filter.categoryId) {
      all = all.filter(p => p.categoryId === filter.categoryId);
    }

    if (filter.condition) {
      all = all.filter(p => p.condition === filter.condition);
    }

    if (filter.priceMin !== undefined || filter.priceMax !== undefined) {
      all = all.filter(p => {
        return p.listings?.some(l => {
          const price = l.buyNowPriceCents;
          if (price === null) return false;
          const minOk = filter.priceMin === undefined || price >= filter.priceMin;
          const maxOk = filter.priceMax === undefined || price <= filter.priceMax;
          return minOk && maxOk;
        });
      });
    }

    return all.slice(filter.offset ?? 0, (filter.offset ?? 0) + (filter.limit ?? 20));
  }

  async deleteProduct(id: string): Promise<void> {
    this.products.delete(id);
  }
}
