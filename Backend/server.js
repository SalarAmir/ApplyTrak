import 'dotenv/config';
import { fastify } from './routes/init.js';

// Import routes to register them
import './routes/route.js';

const PORT = process.env.PORT || 3000;

fastify.listen(
  { host: '0.0.0.0', port: PORT },
  function (err, address) {
    if (err) {
      fastify.log.error(err);
      process.exit(1);
    }
    fastify.log.info(`Server listening on ${address}`);
  }
);