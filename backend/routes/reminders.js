const express = require('express');
const router = express.Router();
const controller = require('../controllers/reminderController');
const auth = require('../middleware/auth');

router.post('/', auth, controller.createReminder);
router.get('/', auth, controller.listForUser);

module.exports = router;
