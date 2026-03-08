const express = require('express');
const router = express.Router();
const controller = require('../controllers/symptomController');
const auth = require('../middleware/auth');

// Primary endpoints for symptom entries
router.post('/', auth, controller.createEntry);
router.get('/', auth, controller.listForUser);

// alias for analysis route if needed
router.post('/analyze', auth, controller.createEntry);

module.exports = router;
