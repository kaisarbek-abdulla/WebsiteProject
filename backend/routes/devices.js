const express = require('express');
const router = express.Router();
const controller = require('../controllers/deviceController');
const auth = require('../middleware/auth');

router.post('/connect', auth, controller.connectDevice);
router.get('/', auth, controller.getDevices);
router.delete('/:deviceId', auth, controller.disconnectDevice);

module.exports = router;