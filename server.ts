import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { getDb } from './server/db.ts';
import { authRouter } from './server/routes/auth.ts';
import { trainsRouter } from './server/routes/trains.ts';
import { bookingsRouter } from './server/routes/bookings.ts';
import { adminRouter } from './server/routes/admin.ts';
import { dbmsRouter } from './server/routes/dbms.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize relational database and seed data
  try {
    await getDb();
    console.log('RailwayDB relational database initialized successfully.');
  } catch (err) {
    console.error('Database initialization error:', err);
  }

  // Mount API routes
  app.use('/api', authRouter);
  app.use('/api', trainsRouter);
  app.use('/api', bookingsRouter);
  app.use('/api', adminRouter);
  app.use('/api', dbmsRouter);

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'healthy',
      system: 'RailConnect Railway Reservation Management System',
      database: 'RailwayDB',
      timestamp: new Date().toISOString(),
    });
  });

  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    // Mount Vite dev server in middleware mode
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve production static assets
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`RailConnect backend server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server error:', err);
  process.exit(1);
});
