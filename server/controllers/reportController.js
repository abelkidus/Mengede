const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Public endpoint that accepts category, description, terminalId, routeId,
 * and optional proposedFare, proposedLatitude, proposedLongitude, proposedDestinationId,
 * and saves the report to the database via Prisma.
 */
const createReport = async (req, res, next) => {
  try {
    const {
      category,
      description,
      terminalId,
      routeId,
      proposedFare,
      proposedLatitude,
      proposedLongitude,
      proposedDestinationId,
    } = req.body;

    if (!category || typeof category !== 'string' || !category.trim()) {
      return res.status(400).json({ error: 'Category is required' });
    }

    if (!description || typeof description !== 'string' || !description.trim()) {
      return res.status(400).json({ error: 'Description is required' });
    }

    const parsedTerminalId = parseInt(terminalId, 10);
    if (isNaN(parsedTerminalId)) {
      return res.status(400).json({ error: 'terminalId is required and must be a valid number' });
    }

    let parsedRouteId = null;
    if (routeId !== undefined && routeId !== null && routeId !== '') {
      parsedRouteId = parseInt(routeId, 10);
      if (isNaN(parsedRouteId)) {
        return res.status(400).json({ error: 'routeId must be a valid number' });
      }
    }

    const report = await prisma.report.create({
      data: {
        category: category.trim(),
        description: description.trim(),
        status: 'PENDING',
        terminalId: parsedTerminalId,
        ...(parsedRouteId ? { routeId: parsedRouteId } : {}),
        proposedFare:
          proposedFare !== undefined && proposedFare !== null && proposedFare !== ''
            ? parseFloat(proposedFare)
            : null,
        proposedLatitude:
          proposedLatitude !== undefined && proposedLatitude !== null && proposedLatitude !== ''
            ? parseFloat(proposedLatitude)
            : null,
        proposedLongitude:
          proposedLongitude !== undefined && proposedLongitude !== null && proposedLongitude !== ''
            ? parseFloat(proposedLongitude)
            : null,
        proposedDestinationId:
          proposedDestinationId !== undefined && proposedDestinationId !== null && proposedDestinationId !== ''
            ? String(proposedDestinationId).trim()
            : null,
      },
      include: {
        terminal: {
          select: {
            id: true,
            name: true,
          },
        },
        route: {
          select: {
            id: true,
            destinationName: true,
          },
        },
      },
    });

    return res.status(201).json(report);
  } catch (error) {
    if (error.code === 'P2003') {
      return res.status(400).json({ error: 'Referenced terminal or route does not exist' });
    }
    console.error('Error creating report:', error);
    next(error);
  }
};

/**
 * Admin endpoint that fetches all reports where status is "PENDING",
 * including the related Terminal and Route names and proposed dynamic fields.
 */
const getPendingReports = async (req, res, next) => {
  try {
    const reports = await prisma.report.findMany({
      where: {
        status: 'PENDING',
      },
      select: {
        id: true,
        category: true,
        description: true,
        status: true,
        terminalId: true,
        routeId: true,
        proposedFare: true,
        proposedLatitude: true,
        proposedLongitude: true,
        proposedDestinationId: true,
        createdAt: true,
        updatedAt: true,
        terminal: {
          select: {
            id: true,
            name: true,
          },
        },
        route: {
          select: {
            id: true,
            destinationName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return res.status(200).json(reports);
  } catch (error) {
    console.error('Error fetching pending reports:', error);
    next(error);
  }
};

/**
 * Admin endpoint that updates a report's status to "RESOLVED" or "DISMISSED".
 */
const updateReportStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['RESOLVED', 'DISMISSED'].includes(status.toUpperCase())) {
      return res.status(400).json({
        error: 'Status must be either RESOLVED or DISMISSED',
      });
    }

    const normalizedStatus = status.toUpperCase();

    const updatedReport = await prisma.report.update({
      where: { id },
      data: {
        status: normalizedStatus,
      },
      include: {
        terminal: {
          select: {
            id: true,
            name: true,
          },
        },
        route: {
          select: {
            id: true,
            destinationName: true,
          },
        },
      },
    });

    return res.status(200).json(updatedReport);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Report not found' });
    }
    console.error('Error updating report status:', error);
    next(error);
  }
};

module.exports = {
  createReport,
  getPendingReports,
  updateReportStatus,
};

