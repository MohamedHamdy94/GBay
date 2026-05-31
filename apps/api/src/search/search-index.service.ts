import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
const { MeiliSearch } = require('meilisearch');
import { SearchDocument } from './search.types';
import { PrismaService } from '../prisma.service';

@Injectable()
export class SearchIndexService implements OnModuleInit {
  private client: any | null = null;
  private index: any | null = null;

  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {
    const host = process.env.MEILISEARCH_HOST;
    const apiKey = process.env.MEILISEARCH_API_KEY;

    if (host) {
      this.client = new MeiliSearch({
        host,
        apiKey,
      });
      this.index = this.client.index('listings');
    }
  }

  async onModuleInit() {
    if (this.index) {
      try {
        await this.index.updateSettings({
          searchableAttributes: ['title', 'title_de', 'description', 'description_de', 'categoryName', 'categoryName_de', 'sellerName'],
          filterableAttributes: ['type', 'categoryId', 'condition', 'sellerId', 'status', 'priceCents'],
          sortableAttributes: ['priceCents', 'createdAt'],
          rankingRules: [
            'words',
            'typo',
            'proximity',
            'attribute',
            'sort',
            'exactness',
          ],
        });
      } catch (error) {
        console.error('Failed to update Meilisearch settings:', error);
      }
    }

    // Start background processor
    setInterval(() => this.processPendingJobs(), 30000); // Every 30 seconds
  }

  get isEnabled(): boolean {
    return this.client !== null;
  }

  async indexListing(document: SearchDocument) {
    if (!this.index) return;
    await this.index.addDocuments([document]);
  }

  async deleteListing(id: string) {
    if (!this.index) return;
    await this.index.deleteDocument(id);
  }

  async clearIndex() {
    if (!this.index) return;
    await this.index.deleteAllDocuments();
  }

  async search(q: string, options: any) {
    if (!this.index) throw new Error('Search index not available');
    return this.index.search(q, options);
  }

  async getStats() {
    if (!this.index) return null;
    return this.index.getStats();
  }

  /**
   * Background worker to process indexing jobs
   */
  async processPendingJobs() {
    const jobs = await this.prisma.searchIndexJob.findMany({
      where: { status: 'PENDING' },
      take: 50,
      orderBy: { createdAt: 'asc' },
    });

    for (const job of jobs) {
      try {
        await this.prisma.searchIndexJob.update({
          where: { id: job.id },
          data: { status: 'PROCESSING', processedAt: new Date() },
        });

        if (job.operation === 'DELETE') {
          await this.deleteListing(`listing-${job.entityId}`);
        } else {
          const doc = await this.prepareDocument(job.entityId);
          if (doc) {
            await this.indexListing(doc);
          }
        }

        await this.prisma.searchIndexJob.update({
          where: { id: job.id },
          data: { status: 'COMPLETED' },
        });
      } catch (error: any) {
        await this.prisma.searchIndexJob.update({
          where: { id: job.id },
          data: { status: 'FAILED', error: error.message },
        });
      }
    }
  }

  private async prepareDocument(listingId: string): Promise<SearchDocument | null> {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      include: {
        product: {
          include: {
            translations: true,
            category: {
              include: { translations: true }
            },
            seller: {
              include: { user: true }
            },
            media: true,
          }
        },
        auction: true,
      }
    });

    if (!listing) return null;

    const enTrans = listing.product.translations.find(t => t.locale === 'en');
    const deTrans = listing.product.translations.find(t => t.locale === 'de');
    
    const enCat = listing.product.category?.translations.find(t => t.locale === 'en');
    const deCat = listing.product.category?.translations.find(t => t.locale === 'de');

    return {
      id: `listing-${listing.id}`,
      entityId: listing.id,
      type: listing.type === 'AUCTION' ? 'AUCTION' : 'PRODUCT',
      title: enTrans?.title || '',
      title_de: deTrans?.title || enTrans?.title || '',
      description: enTrans?.description || '',
      description_de: deTrans?.description || enTrans?.description || '',
      priceCents: listing.buyNowPriceCents || listing.auction?.currentHighestBidCents || listing.auction?.startPriceCents || 0,
      currency: listing.currency,
      categoryId: listing.product.categoryId || 'uncategorized',
      categoryName: enCat?.name || 'Uncategorized',
      categoryName_de: deCat?.name || enCat?.name || 'Nicht kategorisiert',
      condition: listing.product.condition,
      sellerId: listing.sellerId,
      sellerName: listing.product.seller.displayName,
      images: listing.product.media.map(m => m.bucketKey),
      status: listing.status,
      auctionEndTime: listing.auction?.endTime.toISOString(),
      auctionStartPrice: listing.auction?.startPriceCents,
      currentBid: listing.auction?.currentHighestBidCents || undefined,
      createdAt: listing.createdAt.toISOString(),
    };
  }
}
