import type { Server } from 'node:http';

export function createPagesServer(options: {
  root: string;
  base: string;
  deepLinkStatus?: 200 | 404;
}): Server;
