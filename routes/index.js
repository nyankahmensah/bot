const router = require('express').Router();

router.use('/webhook', require('./webhooks'));

module.exports = router;
