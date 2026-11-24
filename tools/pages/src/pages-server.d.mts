import type { Server } from 'node:http';

export function createPagesServer(options: { root: string; base: string }): Server;
