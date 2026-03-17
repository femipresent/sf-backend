const express = require('express');
const router = express.Router();
const { calculateQuote } = require('../admin/pricing.controller');

router.post('/calculate', calculateQuote);

module.exports = router;
