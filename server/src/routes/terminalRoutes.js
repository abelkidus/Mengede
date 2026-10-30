const express = require('express');
const requireAuth = require('../../middleware/authMiddleware');
const { updateTerminalRoutes } = require('../controllers/terminalController');

const router = express.Router();

// PUT route for updating a specific terminal's routes
router.put('/:id/routes', requireAuth, updateTerminalRoutes);

router.updateTerminalRoutes = updateTerminalRoutes;
module.exports = router;
module.exports.router = router;
module.exports.updateTerminalRoutes = updateTerminalRoutes;
