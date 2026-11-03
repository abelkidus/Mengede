const express = require('express');
const { loginLimiter } = require('../src/middleware/rateLimiter');

const router = express.Router();

const loginController = async (req, res) => {
  return res.status(200).json({ message: 'Login successful' });
};

router.post('/login', loginLimiter, loginController);

module.exports = router;

