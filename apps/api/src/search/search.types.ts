export interface SearchDocument {
  id: string; // listing-{listingId}
  entityId: string; // listingId
  type: 'PRODUCT' | 'AUCTION';
  title: string;
  title_de: string;
  description: string;
  description_de: string;
  priceCents: number;
  currency: string;
  categoryId: string;
  categoryName: string;
  categoryName_de: string;
  condition: string;
  sellerId: string;
  sellerName: string;
  images: string[];
  status: string;
  auctionEndTime?: string;
  auctionStartPrice?: number;
  currentBid?: number;
  createdAt: string;
}

export interface SearchFilters {
  q?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  condition?: string;
  type?: 'PRODUCT' | 'AUCTION';
  sellerId?: string;
  status?: string;
  page?: number;
  limit?: number;
  sort?: 'relevance' | 'price_asc' | 'price_desc' | 'newest';
}

export interface SearchResult {
  hits: SearchDocument[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
