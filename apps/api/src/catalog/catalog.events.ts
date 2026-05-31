export class ProductCreatedEvent {
  constructor(public readonly productId: string, public readonly sellerId: string) {}
}

export class ProductDeletedEvent {
  constructor(public readonly productId: string, public readonly sellerId: string) {}
}
