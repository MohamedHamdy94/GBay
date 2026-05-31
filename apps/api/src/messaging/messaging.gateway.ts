import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'messaging',
})
export class MessagingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  handleConnection(client: Socket) {
    // console.log(`Messaging client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    // console.log(`Messaging client disconnected: ${client.id}`);
  }

  @SubscribeMessage('messaging:join')
  handleJoin(@ConnectedSocket() client: Socket, @MessageBody('userId') userId: string) {
    // In a real app, we should verify the userId from the token
    client.join(`user:${userId}`);
  }

  emitNewMessage(userId: string, payload: any) {
    this.server.to(`user:${userId}`).emit('message:new', payload);
  }

  emitNewThread(userId: string, payload: any) {
    this.server.to(`user:${userId}`).emit('thread:new', payload);
  }
}
