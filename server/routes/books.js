const { Router } = require('express');
const { heavyLimiter } = require('../middleware/rateLimiter');
const { getBook } = require('../controllers/bookController');

const router = Router();

// GET /api/books/:id?source=openLibrary
router.get('/:id', heavyLimiter, getBook);

module.exports = router;
