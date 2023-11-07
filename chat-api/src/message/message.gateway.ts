import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { IMessage } from './message.interface';

@WebSocketGateway({
  cors: true,
})
export class MessageGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private clients: Map<string, { client: Socket; username: string }> =
    new Map();

  private messages: IMessage[] = [
    {
      content: 'Welcome to the chat!',
      name: 'Server',
      timeSent: new Date().toUTCString(),
    },
  ];

  @SubscribeMessage('user-check')
  handleUserCheck(client: Socket, payload: string): void {
    let exists = false;
    this.clients.forEach(({ username }) => {
      exists = username === payload;
    });

    client.emit('user-exist', {
      username: payload,
      exists,
    });
  }

  @SubscribeMessage('user-add')
  handleUserAdd(client: Socket, payload: string): void {
    let exists = false;
    this.clients.forEach(({ username }) => {
      exists = username === payload;
    });
    if (exists) {
      client.emit('user-exist', {
        username: payload,
        exists,
      });

      return;
    }

    this.clients.set(client.id, { client, username: payload });
  }

  @SubscribeMessage('messages')
  handleMessage(client: Socket, payload: IMessage): void {
    this.server.emit('messages', payload);
    this.messages.push(payload);
  }

  handleConnection(client: Socket) {
    this.clients.set(client.id, { client, username: '' });
    client.emit('old-messages', this.messages);
  }

  handleDisconnect(client: Socket) {
    this.clients.delete(client.id);
  }
}
