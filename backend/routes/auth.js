const express = require('express');
const router = express.Router();
const controller = require('../controllers/authController');
const auth = require('../middleware/auth');

router.post('/register', controller.register);
router.post('/login', controller.login);
router.get('/profile', auth, controller.getProfile);
router.get('/patients/all', auth, controller.getPatients);
router.get('/doctors/all', auth, controller.getDoctors);
router.get('/users/all', auth, controller.getAllUsers);
router.put('/:id/profile', auth, controller.updateProfile);
router.put('/users/:id', auth, controller.updateUser);
router.delete('/users/:id', auth, controller.deleteUser);
// Keep this last so it doesn't shadow the routes above (e.g. `/profile`).
router.get('/:id', controller.getUser);

module.exports = router;
