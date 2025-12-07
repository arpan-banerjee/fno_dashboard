import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from './routes/auth';
import adminRoutes from './routes/admin';
import marketRoutes from './routes/market';
import moodRoutes from './routes/mood';
import { setupWebSocketServer } from './routes/stream';

// Import WebSocket service
import { websocketService } from './services/websocket';
import { marketDataPoller } from './services/marketDataPoller';

// Import database initialization
import { initializeDatabase } from './db/init';

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);
app.use('/market', marketRoutes);
app.use('/mood', moodRoutes);

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

// Initialize database
initializeDatabase()
  .then(() => {
    console.log('Database initialized successfully');
  })
  .catch((err) => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });

// Create HTTP server
const server = createServer(app);

// Setup WebSocket servers
const wss = new WebSocketServer({ server, path: '/stream/ticks' });
setupWebSocketServer(wss);

// Initialize market data WebSocket service
websocketService.initialize(server);

// Global error handlers
process.on('unhandledRejection', (reason, promise) => {
  console.error('⚠️  Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit the process
});

process.on('uncaughtException', (error) => {
  console.error('⚠️  Uncaught Exception:', error);
  // Don't exit the process
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 API server running on http://localhost:${PORT}`);
  console.log(`📡 WebSocket server running on ws://localhost:${PORT}/stream/ticks`);
  console.log(`📡 Market data WebSocket running on ws://localhost:${PORT}/ws`);
  console.log(`🔧 Mock mode: ${process.env.MOCK_MODE === 'true' ? 'ENABLED' : 'DISABLED'}`);
  console.log(`✅ Server ready - WebSocket clients can now connect`);
  console.log(`📊 Market data polling will start when clients subscribe to channels`);
  
  // Don't start polling automatically - let clients trigger it
  // This avoids unnecessary API calls and potential crashes
});

export default app;
