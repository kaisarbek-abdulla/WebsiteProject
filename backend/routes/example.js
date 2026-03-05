const express = require('express');
const router = express.Router();

// Example route
router.get('/api/example', (req, res) => {
    res.json({ message: 'Example API response' });
});

module.exports = router;
