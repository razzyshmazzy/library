const { Router } = require('express');
const { searchLimiter } = require('../middleware/rateLimiter');
const { getSuggestions, getResults } = require('../controllers/searchController');

const router = Router();

// GET /api/search/suggestions?q=...&databases=openLibrary,internetArchive
router.get('/suggestions', searchLimiter, getSuggestions);

// GET /api/search/results?q=...&category=...&databases=all&page=1&limit=20
router.get('/results', searchLimiter, getResults);

module.exports = router;
