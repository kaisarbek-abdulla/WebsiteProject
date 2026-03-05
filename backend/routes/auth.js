const express = require('express');
const router = express.Router();
const controller = require('../controllers/authController');
const auth = require('../middleware/auth');

router.post('/register', controller.register);
router.post('/login', controller.login);
router.get('/:id', controller.getUser);
router.get('/profile', auth, controller.getProfile);
router.get('/patients/all', auth, controller.getPatients);
router.get('/users/all', auth, controller.getAllUsers);
router.put('/:id/profile', auth, controller.updateProfile);

module.exports = router;
