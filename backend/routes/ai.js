const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const controller = require('../controllers/aiController');

router.post('/doctor-assistant', auth, controller.doctorAssistant);

module.exports = router;

