import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Inject } from '@nestjs/common';
import { MetricsService } from '../observability/metrics/metrics.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'auctions',
})
export class AuctionGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly watchers = new Map<string, Set<string>>();
  private connectionCount = 0;

  constructor(
    @Inject(MetricsService) private readonly metricsService: MetricsService,
  ) {}

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
    this.connectionCount++;
    this.metricsService.updateWebsocketConnections(this.connectionCount);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    this.connectionCount = Math.max(0, this.connectionCount - 1);
    this.metricsService.updateWebsocketConnections(this.connectionCount);
    
    // Clean up watchers if necessary
    for (const [auctionId, clients] of this.watchers.entries()) {
      if (clients.has(client.id)) {
        clients.delete(client.id);
        this.emitWatcherCount(auctionId);
      }
    }
  }

  /**
   * Joins an auction room to receive real-time updates.
   * @param client The socket client
   * @param auctionId The ID of the auction to watch
   */
  @SubscribeMessage('auction:join')
  handleJoin(@ConnectedSocket() client: Socket, @MessageBody('auctionId') auctionId: string) {
    client.join(`auction:${auctionId}`);
    
    if (!this.watchers.has(auctionId)) {
      this.watchers.set(auctionId, new Set());
    }
    this.watchers.get(auctionId)!.add(client.id);
    
    this.emitWatcherCount(auctionId);
  }

  /**
   * Leaves an auction room.
   * @param client The socket client
   * @param auctionId The ID of the auction
   */
  @SubscribeMessage('auction:leave')
  handleLeave(@ConnectedSocket() client: Socket, @MessageBody('auctionId') auctionId: string) {
    client.leave(`auction:${auctionId}`);
    
    if (this.watchers.has(auctionId)) {
      this.watchers.get(auctionId)!.delete(client.id);
      this.emitWatcherCount(auctionId);
    }
  }

  /**
   * Broadcasts a new bid update to all watchers of an auction.
   * @param auctionId The ID of the auction
   * @param payload The bid data (amount, bidder display name, etc.)
   */
  emitBid(auctionId: string, payload: any) {
    this.server.to(`auction:${auctionId}`).emit('auction:bid', payload);
  }

  /**
   * Broadcasts an auction time extension (anti-sniping).
   * @param auctionId The ID of the auction
   * @param newEndTime The new end time ISO string
   */
  emitExtension(auctionId: string, newEndTime: string) {
    this.server.to(`auction:${auctionId}`).emit('auction:extension', { newEndTime });
  }

  /**
   * Broadcasts that an auction has ended.
   * @param auctionId The ID of the auction
   * @param winner The winning bid data
   */
  emitEnd(auctionId: string, winner: any) {
    this.server.to(`auction:${auctionId}`).emit('auction:ended', winner);
  }

  private emitWatcherCount(auctionId: string) {
    const count = this.watchers.get(auctionId)?.size || 0;
    this.server.to(`auction:${auctionId}`).emit('auction:watchers', { count });
  }
}
