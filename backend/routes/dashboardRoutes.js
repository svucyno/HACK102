const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { getDashboard, chatWithAI } = require('../controllers/dashboardController');

// GET /api/dashboard
router.get('/', authMiddleware, getDashboard);

// POST /api/dashboard/chat
router.post('/chat', authMiddleware, chatWithAI);

module.exports = router;
