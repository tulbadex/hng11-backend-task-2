const jwt = require('jsonwebtoken');
const User = require('../models/user'); // Replace with your Sequelize models import

module.exports = async (req, res, next) => {
  const authHeader = req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ status: 'Unauthorized', message: 'No or invalid token provided', statusCode: 401 });
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    // Check if user exists in the database
    const user = await User.findOne({ where: { userId: decoded.userId } });

    if (!user) {
      return res.status(401).json({ status: 'Unauthorized', message: 'User not found', statusCode: 401 });
    }

    // Optionally, you can add more checks like if the user is active or has necessary permissions

    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ status: 'Unauthorized', message: 'Invalid token', statusCode: 401 });
    }
    res.status(500).json({ status: 'Internal Server Error', message: err.message, statusCode: 500 });
  }
};