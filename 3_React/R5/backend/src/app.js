import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import morgan from 'morgan';
import passport from 'passport';
import session from 'express-session';
import { env } from './config/env.js';
import { setupPassport } from './config/passport.js';
import { errorHandler, notFound } from './middlewares/errorMiddleware.js';
import { authRoutes } from './routes/authRoutes.js';
import { userRoutes } from './routes/userRoutes.js';

export const app = express();

setupPassport();

app.use(
  session({
    secret: env.jwtSecret,
    resave: false,
    saveUninitialized: false,
  }),
);

app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || env.clientOrigins.includes(origin) || env.clientOrigins.includes('*')) {
        callback(null, true);
      } else {
        if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
          callback(null, true);
        } else {
          callback(new Error('Bloqueado por política CORS'));
        }
      }
    },
    credentials: true,
  }),
);
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 250,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);
app.use(express.json({ limit: '25kb' }));
app.use(morgan('dev'));
app.use(passport.initialize());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'sistema-usuarios-r5-api' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use(notFound);
app.use(errorHandler);
