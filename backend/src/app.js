import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.routes.js';
import leadRoutes from './routes/lead.routes.js';
import companyRoutes from './routes/company.routes.js';
import contactRoutes from './routes/contact.routes.js';
import dealRoutes from './routes/deal.routes.js';
import userRoutes from './routes/user.routes.js';
import taskRoutes from './routes/task.routes.js';
import activityRoutes from './routes/activity.routes.js';
import noteRoutes from './routes/note.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import searchRoutes from './routes/search.routes.js';
import exportRoutes from './routes/export.routes.js';
import importRoutes from './routes/import.routes.js';
import auditRoutes from './routes/audit.routes.js';
import notificationRoutes from './routes/notification.routes.js';


const app = express();

// Trust the reverse proxy (e.g., Cloud Run, NGINX) to ensure express-rate-limit
// accurately identifies client IPs from the X-Forwarded-For headers.
app.set('trust proxy', 1);

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));

// Security Headers
app.use(helmet({
  contentSecurityPolicy: false, // Don't break React app during dev
}));

// Rate Limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per `window` (here, per 15 minutes)
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests from this IP, please try again after 15 minutes' },
  validate: { xForwardedForHeader: false }
});

const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // Limit each IP to 20 login/register requests per hour
  message: { success: false, message: 'Too many authentication attempts, please try again later' },
  validate: { xForwardedForHeader: false }
});

app.use('/api', apiLimiter);
app.use('/api/auth', authLimiter);

app.use(express.json({ limit: '500kb' }));
app.use(cookieParser());

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'API is healthy' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/deals', dealRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/import', importRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/notifications', notificationRoutes);



// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  const status = err.status || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'An unexpected error occurred' 
    : err.message || 'Internal Server Error';
  
  res.status(status).json({
    success: false,
    message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

export default app;

