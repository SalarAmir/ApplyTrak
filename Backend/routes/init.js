import Fastify from 'fastify';
import cors from '@fastify/cors';

export const fastify = Fastify({ logger: true });

export const BASE_PATH = '/api/v1';

// Register CORS plugin
await fastify.register(cors, {
  origin: '*', // Allow all origins (update for production)
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
});