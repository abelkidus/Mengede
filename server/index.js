require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('./middleware/authMiddleware');
const {
  globalLimiter,
  loginLimiter,
  submissionLimiter,
} = require('./middleware/rateLimiters');
const {
  validate,
  loginSchema,
  createRouteSchema,
  updateStatusSchema,
} = require('./middleware/validate');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

// Pre-computed static dummy bcrypt hash (cost factor 10) to mitigate username timing enumeration
const DUMMY_PASSWORD_HASH = '$2b$10$kR7NhZgow5TB/H4Ac646QeZSUw..rCKNznN2EWVrMFhqzSf/h60Iu';

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PATCH'],
    credentials: true,
  })
);
app.use(express.json({ limit: '10kb' }));

// 1. Global rate limiter for all /api endpoints
app.use('/api', globalLimiter);

// Basic health check route
app.get('/', (req, res) => {
  res.send('Server is running');
});

// 1. GET /api/terminals: Fetch all terminals including associated APPROVED routes
app.get('/api/terminals', async (req, res, next) => {
  try {
    const terminals = await prisma.terminal.findMany({
      include: {
        routes: {
          where: {
            status: 'APPROVED',
          },
        },
      },
      orderBy: {
        id: 'asc',
      },
    });
    res.json(terminals);
  } catch (error) {
    next(error);
  }
});

// 2. POST /api/routes: Submit a new route (originId, destinationName, fare) defaulting to PENDING
app.post('/api/routes', submissionLimiter, validate(createRouteSchema), async (req, res, next) => {
  try {
    // Strictly extract validated variables from Zod
    const { originId, destinationName, fare } = req.validatedBody || req.body;

    // Ensure origin terminal exists using validated terminal ID
    const terminal = await prisma.terminal.findUnique({
      where: { id: originId },
    });

    if (!terminal) {
      return res.status(404).json({ error: 'Origin terminal not found' });
    }

    // Insert route using strictly validated variables
    const newRoute = await prisma.route.create({
      data: {
        originId,
        destinationName,
        fare,
        status: 'PENDING',
      },
      include: {
        origin: true,
      },
    });

    res.status(201).json(newRoute);
  } catch (error) {
    next(error);
  }
});

// 3. POST /api/admin/login: Authenticate admin and return a signed 24h JWT
app.post('/api/admin/login', loginLimiter, validate(loginSchema), async (req, res, next) => {
  try {
    const { username, password } = req.validatedBody || req.body;

    const expectedUsername = process.env.ADMIN_USERNAME;
    const passwordHash = process.env.ADMIN_PASSWORD_HASH;
    const jwtSecret = process.env.JWT_SECRET;

    if (!expectedUsername || !passwordHash || !jwtSecret) {
      console.error('Admin authentication environment variables are not configured');
      return res.status(500).json({
        error: 'Server authentication configuration error',
      });
    }

    const isUsernameMatch = username === expectedUsername;
    // Mitigate username timing enumeration: always execute bcrypt.compare
    // If username does not match, compare against static dummy bcrypt hash
    const hashToCompare = isUsernameMatch ? passwordHash : DUMMY_PASSWORD_HASH;
    const isPasswordValid = await bcrypt.compare(password, hashToCompare);

    if (!isUsernameMatch || !isPasswordValid) {
      return res.status(401).json({
        error: 'Invalid credentials',
      });
    }

    // On success, return a signed JWT expiring in 24 hours with explicit HS256 algorithm
    const token = jwt.sign(
      { username: expectedUsername, role: 'admin' },
      jwtSecret,
      { expiresIn: '24h', algorithm: 'HS256' }
    );

    res.json({
      message: 'Login successful',
      token,
    });
  } catch (error) {
    next(error);
  }
});

// 4. GET /api/admin/pending: Fetch all routes with status PENDING (Protected)
app.get('/api/admin/pending', authMiddleware, async (req, res, next) => {
  try {
    const pendingRoutes = await prisma.route.findMany({
      where: {
        status: 'PENDING',
      },
      include: {
        origin: true,
      },
      orderBy: {
        id: 'desc',
      },
    });
    res.json(pendingRoutes);
  } catch (error) {
    next(error);
  }
});

// 5. PATCH /api/admin/routes/:id/status: Update a route's status to 'APPROVED' or 'REJECTED' (Protected)
app.patch('/api/admin/routes/:id/status', authMiddleware, validate(updateStatusSchema), async (req, res, next) => {
  try {
    // Strictly extract validated variables from Zod
    const routeId = req.validatedParams?.id ?? (req.params?.id ? parseInt(req.params.id, 10) : undefined);
    const { status, destinationName, fare } = req.validatedBody || req.body;

    const existingRoute = await prisma.route.findUnique({
      where: { id: routeId },
    });

    if (!existingRoute) {
      return res.status(404).json({ error: 'Route not found' });
    }

    // Build update payload using strictly validated variables
    const updateData = { status };
    if (destinationName !== undefined) {
      updateData.destinationName = destinationName;
    }
    if (fare !== undefined) {
      updateData.fare = fare;
    }

    // Update route using strictly validated variables
    const updatedRoute = await prisma.route.update({
      where: { id: routeId },
      data: updateData,
      include: {
        origin: true,
      },
    });

    res.json(updatedRoute);
  } catch (error) {
    next(error);
  }
});

// Centralized Express error-handling middleware at the bottom of the middleware stack
app.use((err, req, res, next) => {
  // Log the full error internally
  console.error('Unhandled server error:', err);

  if (res.headersSent) {
    return next(err);
  }

  // Preserve explicit client errors (4xx) if set
  const statusCode = err.status || err.statusCode;
  if (statusCode && statusCode >= 400 && statusCode < 500) {
    return res.status(statusCode).json({
      error: err.message || 'Client error',
    });
  }

  // Ensure any unhandled or Prisma database errors return a generic 500 response
  // so database table names, constraint details, and stack traces are never exposed
  return res.status(500).json({
    error: 'An unexpected server error occurred',
  });
});

// Start the server if this file is run directly
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

module.exports = { app, prisma };
