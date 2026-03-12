const { Router } = require('express');
const { heavyLimiter } = require('../middleware/rateLimiter');
const { downloadPdf, convertPdf } = require('../controllers/pdfController');

const router = Router();

// GET /api/pdfs/download/:bookId?format=pdf&source=internetArchive&stream=false
router.get('/download/:bookId', heavyLimiter, downloadPdf);

// POST /api/pdfs/convert  (placeholder — returns 501)
router.post('/convert', convertPdf);

module.exports = router;
