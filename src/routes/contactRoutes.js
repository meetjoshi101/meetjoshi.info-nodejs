const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const { submitInquiry } = require('../controllers/contactController');

const contactLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { message: 'Too many requests, please try again later' },
});

router.post('/', contactLimiter, submitInquiry);

module.exports = router;
