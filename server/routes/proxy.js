const express = require('express');
const router = express.Router();
const { proxyText } = require('../controllers/proxyController');

router.get('/text', proxyText);

module.exports = router;
