const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const controller = require('../controllers/messageController');

router.get('/with/:id', auth, controller.listWithUser);
router.get('/admin-inbox', auth, controller.adminInbox);
router.post('/', auth, controller.send);

module.exports = router;
