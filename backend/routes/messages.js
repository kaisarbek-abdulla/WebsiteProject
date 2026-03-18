const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const controller = require('../controllers/messageController');

router.get('/with/:id', auth, controller.listWithUser);
router.post('/', auth, controller.send);

module.exports = router;

