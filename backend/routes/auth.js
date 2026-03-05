const express = require('express');
const router = express.Router();
const controller = require('../controllers/authController');
const auth = require('../middleware/auth');

router.post('/register', controller.register);
router.post('/login', controller.login);
router.get('/:id', controller.getUser);
router.put('/:id/profile', auth, controller.updateProfile);

module.exports = router;
