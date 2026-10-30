const { PrismaClient } = require('@prisma/client');

// Prisma Client with query extension to map 'destination' to schema field 'destinationName'
const basePrisma = new PrismaClient();
const prisma = basePrisma.$extends({
  query: {
    terminal: {
      async update({ args, query }) {
        if (args.data?.routes?.create) {
          const list = Array.isArray(args.data.routes.create)
            ? args.data.routes.create
            : [args.data.routes.create];
          args.data.routes.create = list.map((r) => ({
            destinationName: r.destinationName || r.destination,
            fare: r.fare,
            status: r.status || 'APPROVED',
          }));
        }
        return query(args);
      },
    },
  },
});

/**
 * Controller to update routes for a specific terminal.
 * Replaces existing routes for the terminal in a single transaction.
 */
const updateTerminalRoutes = async (req, res) => {
  try {
    const { id } = req.params;
    const rawRoutes = req.body.routes !== undefined ? req.body.routes : req.body;
    const routes = (Array.isArray(rawRoutes) ? rawRoutes : []).map((route) => ({
      ...route,
      destination: route.destination || route.destinationName,
    }));

    const updatedTerminal = await prisma.terminal.update({
      where: { id: parseInt(id) },
      data: {
        routes: {
          deleteMany: {}, // Clears out the old routes
          create: routes.map(route => ({ destination: route.destination, fare: parseFloat(route.fare) })) // Inserts the new ones
        }
      },
      include: { routes: true }
    });

    return res.status(200).json(updatedTerminal);
  } catch (error) {
    console.error('Error updating terminal routes:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};

module.exports = {
  updateTerminalRoutes,
};

