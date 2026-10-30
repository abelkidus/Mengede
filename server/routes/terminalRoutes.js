const express = require('express');
const { PrismaClient } = require('@prisma/client');
const requireAuth = require('../middleware/authMiddleware');

const router = express.Router();
const prisma = new PrismaClient();

/**
 * Controller to update routes for a specific terminal.
 * PUT /:id/routes
 * Protected by JWT authentication (admins only).
 */
const updateTerminalRoutes = async (req, res, next) => {
  try {
    const terminalId = parseInt(req.params.id, 10);
    if (isNaN(terminalId)) {
      return res.status(400).json({ error: 'Invalid terminal ID' });
    }

    const terminal = await prisma.terminal.findUnique({
      where: { id: terminalId },
      include: { routes: true },
    });

    if (!terminal) {
      return res.status(404).json({ error: 'Terminal not found' });
    }

    const routesData = Array.isArray(req.body)
      ? req.body
      : Array.isArray(req.body?.routes)
      ? req.body.routes
      : req.body && typeof req.body === 'object' && req.body.destinationName
      ? [req.body]
      : null;

    if (!routesData) {
      return res.status(400).json({ error: 'Routes array is required' });
    }

    const validRoutes = routesData.filter(
      (r) =>
        r &&
        typeof r.destinationName === 'string' &&
        r.destinationName.trim() !== '' &&
        !isNaN(parseFloat(r.fare))
    );

    const providedIds = validRoutes
      .filter((r) => r.id !== undefined && r.id !== null)
      .map((r) => parseInt(r.id, 10));

    // If synchronizing the collection, remove routes that were removed in the UI
    if (Array.isArray(req.body) || Array.isArray(req.body?.routes)) {
      await prisma.route.deleteMany({
        where: {
          originId: terminalId,
          id: { notIn: providedIds },
        },
      });
    }

    // Upsert or create/update routes
    for (const route of validRoutes) {
      const destinationName = route.destinationName.trim();
      const fare = parseFloat(route.fare);
      const status = route.status || 'APPROVED';

      if (route.id) {
        const routeId = parseInt(route.id, 10);
        await prisma.route.update({
          where: { id: routeId },
          data: {
            destinationName,
            fare,
            status,
          },
        });
      } else {
        await prisma.route.create({
          data: {
            originId: terminalId,
            destinationName,
            fare,
            status,
          },
        });
      }
    }

    const updatedTerminal = await prisma.terminal.findUnique({
      where: { id: terminalId },
      include: {
        routes: {
          orderBy: { id: 'asc' },
        },
      },
    });

    return res.json({
      message: 'Terminal routes updated successfully',
      terminal: updatedTerminal,
      routes: updatedTerminal.routes,
    });
  } catch (error) {
    if (typeof next === 'function') {
      next(error);
    } else {
      console.error('Error updating terminal routes:', error);
      res.status(500).json({ error: 'An unexpected server error occurred' });
    }
  }
};

// 1. Add new PUT route for updating a specific terminal's routes
router.put('/:id/routes', requireAuth, updateTerminalRoutes);

// 2. Export this router and handler
router.updateTerminalRoutes = updateTerminalRoutes;
module.exports = router;
module.exports.router = router;
module.exports.updateTerminalRoutes = updateTerminalRoutes;

