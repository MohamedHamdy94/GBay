export type Locale = 'en' | 'de';

export interface CategoryTranslationInput {
  locale: Locale;
  name: string;
  slug: string;
}

export interface CreateCategoryInput {
  parentId?: string | null;
  key: string;
  sortOrder?: number;
  translations: CategoryTranslationInput[];
}

export interface UpdateCategoryInput {
  parentId?: string | null;
  key?: string;
  sortOrder?: number;
  translations?: CategoryTranslationInput[];
}

export interface ProductTranslationInput {
  locale: Locale;
  title: string;
  slug: string;
  description: string;
}

export interface MediaAssetInput {
  bucketKey: string;
  contentType: string;
  sizeBytes: number;
  sortOrder?: number;
}

export interface ListingInput {
  type?: 'BUY_NOW' | 'AUCTION';
  buyNowPriceCents?: number;
  quantityTotal?: number;
  startingBidCents?: number;
  reservePriceCents?: number;
  minBidIncrementCents?: number;
  auctionDurationDays?: number;
}

export interface CreateProductInput {
  sellerId: string;
  sellerUserId?: string;
  sku?: string;
  categoryId?: string | null;
  brand?: string;
  condition: string;
  translations: ProductTranslationInput[];
  media?: MediaAssetInput[];
  listing?: ListingInput;
}

export interface UpdateProductInput {
  sku?: string;
  categoryId?: string | null;
  brand?: string;
  condition?: string;
  translations?: ProductTranslationInput[];
  status?: string;
  media?: MediaAssetInput[];
}

export interface CategoryView {
  id: string;
  parentId: string | null;
  key: string;
  sortOrder: number;
  createdAt: Date;
  translations: {
    locale: Locale;
    name: string;
    slug: string;
  }[];
  children?: CategoryView[];
}

export interface ProductView {
  id: string;
  sellerId: string;
  sellerUserId: string | null;
  sku: string | null;
  status: string;
  categoryId: string | null;
  brand: string | null;
  condition: string;
  createdAt: Date;
  updatedAt: Date;
  translations: {
    locale: Locale;
    title: string;
    slug: string;
    description: string;
  }[];
  media?: {
    id: string;
    bucketKey: string;
    contentType: string;
    sizeBytes: number;
    sortOrder: number;
  }[];
  listings?: {
    id: string;
    type: 'BUY_NOW' | 'AUCTION';
    buyNowPriceCents: number | null;
    quantityTotal: number;
    quantityAvailable: number;
    auction?: any;
  }[];
}

export interface ProductFilterInput {
  categoryId?: string;
  priceMin?: number;
  priceMax?: number;
  condition?: string;
  status?: string;
  limit?: number;
  offset?: number;
}

export interface CatalogRepository {
  createCategory(input: CreateCategoryInput): Promise<CategoryView>;
  updateCategory(id: string, input: UpdateCategoryInput): Promise<CategoryView>;
  findCategoryById(id: string): Promise<CategoryView | null>;
  findCategoryByKey(key: string): Promise<CategoryView | null>;
  listCategories(tree?: boolean): Promise<CategoryView[]>;
  deleteCategory(id: string): Promise<void>;

  createProduct(input: CreateProductInput): Promise<ProductView>;
  updateProduct(id: string, input: UpdateProductInput): Promise<ProductView>;
  findProductById(id: string): Promise<ProductView | null>;
  listProductsBySeller(sellerId: string): Promise<ProductView[]>;
  listProducts(filter: ProductFilterInput): Promise<ProductView[]>;
  deleteProduct(id: string): Promise<void>;
}
