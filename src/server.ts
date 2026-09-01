import { Server } from 'http';
import dns from 'dns'; 

dns.setServers(['1.1.1.1','8.8.8.8']);

import mongoose from 'mongoose';
import app from './app';

import config from './app/config';

let server: Server;

async function main() {
  try {
    await mongoose.connect(config.database_url as string);
    // seedSuperAdmin();
    server = app.listen(config.port, () => {
      console.log(`Craft Institute Server live on port ${config.port}`);
    });
  } catch (err) {
    console.log(err);
  }
}

main();

process.on('unhandledRejection', (err) => {
  console.log(`😈 unahandledRejection is detected , shutting down ...`, err);
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  }
  process.exit(1);
});

process.on('uncaughtException', () => {
  console.log(`😈 uncaughtException is detected , shutting down ...`);
  process.exit(1);
});
