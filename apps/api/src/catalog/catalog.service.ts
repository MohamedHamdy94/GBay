import { Inject, Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CatalogRepository, CreateCategoryInput, UpdateCategoryInput, CreateProductInput, UpdateProductInput, ProductFilterInput } from './catalog.types';
import { ProductCreatedEvent, ProductDeletedEvent } from './catalog.events';

export const CATALOG_REPOSITORY = Symbol('CATALOG_REPOSITORY');

@Injectable()
export class CatalogService {
  constructor(
    @Inject(CATALOG_REPOSITORY) private readonly repository: CatalogRepository,
    @Inject(EventEmitter2) private readonly eventEmitter: EventEmitter2,
  ) {}

  async createCategory(input: CreateCategoryInput) {
    const existing = await this.repository.findCategoryByKey(input.key);
    if (existing) {
      throw new ConflictException({ code: 'CATEGORY_ALREADY_EXISTS', key: input.key });
    }
    return this.repository.createCategory(input);
  }

  async updateCategory(id: string, input: UpdateCategoryInput) {
    const category = await this.repository.findCategoryById(id);
    if (!category) {
      throw new NotFoundException({ code: 'CATEGORY_NOT_FOUND', id });
    }
    return this.repository.updateCategory(id, input);
  }

  async getCategory(id: string) {
    const category = await this.repository.findCategoryById(id);
    if (!category) {
      throw new NotFoundException({ code: 'CATEGORY_NOT_FOUND', id });
    }
    return category;
  }

  async listCategories(tree = false) {
    return this.repository.listCategories(tree);
  }

  async deleteCategory(id: string) {
    const category = await this.repository.findCategoryById(id);
    if (!category) {
      throw new NotFoundException({ code: 'CATEGORY_NOT_FOUND', id });
    }
    return this.repository.deleteCategory(id);
  }

  async createProduct(input: CreateProductInput) {
    const product = await this.repository.createProduct(input);
    this.eventEmitter.emit('product.created', new ProductCreatedEvent(product.id, product.sellerId));
    return product;
  }

  async updateProduct(id: string, input: UpdateProductInput) {
    const product = await this.repository.findProductById(id);
    if (!product) {
      throw new NotFoundException({ code: 'PRODUCT_NOT_FOUND', id });
    }
    return this.repository.updateProduct(id, input);
  }

  async getProduct(id: string) {
    const product = await this.repository.findProductById(id);
    if (!product) {
      throw new NotFoundException({ code: 'PRODUCT_NOT_FOUND', id });
    }
    return product;
  }

  async listProductsBySeller(sellerId: string) {
    return this.repository.listProductsBySeller(sellerId);
  }

  async listProducts(filter: ProductFilterInput) {
    return this.repository.listProducts(filter);
  }

  async deleteProduct(id: string) {
    const product = await this.repository.findProductById(id);
    if (!product) {
      throw new NotFoundException({ code: 'PRODUCT_NOT_FOUND', id });
    }
    await this.repository.deleteProduct(id);
    this.eventEmitter.emit('product.deleted', new ProductDeletedEvent(id, product.sellerId));
    return { success: true };
  }
}
