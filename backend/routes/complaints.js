const express = require('express');
const router = express.Router();
const controller = require('../controllers/complaintController');
const auth = require('../middleware/auth');

router.post('/', auth, controller.submitComplaint);
router.get('/', auth, controller.getComplaints);

module.exports = router;