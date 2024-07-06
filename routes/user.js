const express = require('express');
const { getUserDetails } = require('../controllers/authController');
const authenticate = require('../middlewares/authenticate');

const router = express.Router();

router.post('/:id', authenticate, getUserDetails);

module.exports = router;