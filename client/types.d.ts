import { Socket as Io } from 'socket.io-client';
import { ClientEvents, ServerEvents } from '@/common/types';

export type Socket = Io<ServerEvents, ClientEvents>;
