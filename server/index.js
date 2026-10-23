require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('./middleware/authMiddleware');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Basic health check route
app.get('/', (req, res) => {
  res.send('Server is running');
});

// 1. GET /api/terminals: Fetch all terminals including associated APPROVED routes
app.get('/api/terminals', async (req, res) => {
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
    console.error('Error fetching terminals:', error);
    res.status(500).json({ error: 'Failed to fetch terminals' });
  }
});

// 2. POST /api/routes: Submit a new route (originId, destinationName, fare) defaulting to PENDING
app.post('/api/routes', async (req, res) => {
  try {
    const { originId, destinationName, fare } = req.body;

    if (!originId || !destinationName || fare === undefined || fare === null) {
      return res.status(400).json({
        error: 'originId, destinationName, and fare are required fields',
      });
    }

    const parsedOriginId = parseInt(originId, 10);
    const parsedFare = parseFloat(fare);

    if (isNaN(parsedOriginId) || isNaN(parsedFare) || parsedFare < 0) {
      return res.status(400).json({
        error: 'originId must be an integer and fare must be a non-negative number',
      });
    }

    // Ensure origin terminal exists
    const terminal = await prisma.terminal.findUnique({
      where: { id: parsedOriginId },
    });

    if (!terminal) {
      return res.status(404).json({ error: 'Origin terminal not found' });
    }

    const newRoute = await prisma.route.create({
      data: {
        originId: parsedOriginId,
        destinationName: destinationName.trim(),
        fare: parsedFare,
        status: 'PENDING',
      },
      include: {
        origin: true,
      },
    });

    res.status(201).json(newRoute);
  } catch (error) {
    console.error('Error creating route:', error);
    res.status(500).json({ error: 'Failed to create route' });
  }
});

// 3. POST /api/admin/login: Authenticate admin and return a signed 24h JWT
app.post('/api/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        error: 'Username and password are required',
      });
    }

    const expectedUsername = process.env.ADMIN_USERNAME;
    const passwordHash = process.env.ADMIN_PASSWORD_HASH;
    const jwtSecret = process.env.JWT_SECRET;

    if (!expectedUsername || !passwordHash || !jwtSecret) {
      console.error('Admin authentication environment variables are not configured');
      return res.status(500).json({
        error: 'Server authentication configuration error',
      });
    }

    // Strictly compare username to process.env.ADMIN_USERNAME
    if (username !== expectedUsername) {
      return res.status(401).json({
        error: 'Invalid username or password',
      });
    }

    // Use bcrypt.compare to verify password against process.env.ADMIN_PASSWORD_HASH
    const isPasswordValid = await bcrypt.compare(password, passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Invalid username or password',
      });
    }

    // On success, return a signed JWT expiring in 24 hours
    const token = jwt.sign(
      { username: expectedUsername, role: 'admin' },
      jwtSecret,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
    });
  } catch (error) {
    console.error('Error during admin login:', error);
    res.status(500).json({ error: 'Internal server error during login' });
  }
});

// 4. GET /api/admin/pending: Fetch all routes with status PENDING (Protected)
app.get('/api/admin/pending', authMiddleware, async (req, res) => {
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
    console.error('Error fetching pending routes:', error);
    res.status(500).json({ error: 'Failed to fetch pending routes' });
  }
});

// 5. PATCH /api/admin/routes/:id/status: Update a route's status to 'APPROVED' or 'REJECTED' (Protected)
app.patch('/api/admin/routes/:id/status', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const routeId = parseInt(id, 10);
    if (isNaN(routeId)) {
      return res.status(400).json({ error: 'Invalid route ID' });
    }

    if (!status || !['APPROVED', 'REJECTED'].includes(status.toUpperCase())) {
      return res.status(400).json({
        error: 'Status must be either "APPROVED" or "REJECTED"',
      });
    }

    const existingRoute = await prisma.route.findUnique({
      where: { id: routeId },
    });

    if (!existingRoute) {
      return res.status(404).json({ error: 'Route not found' });
    }

    const updatedRoute = await prisma.route.update({
      where: { id: routeId },
      data: {
        status: status.toUpperCase(),
      },
      include: {
        origin: true,
      },
    });

    res.json(updatedRoute);
  } catch (error) {
    console.error('Error updating route status:', error);
    res.status(500).json({ error: 'Failed to update route status' });
  }
});

// Start the server if this file is run directly
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

module.exports = { app, prisma };
