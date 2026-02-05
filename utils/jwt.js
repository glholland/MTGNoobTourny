const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-key';

function generateToken(user) {
  const payload = {
    id: user.id,
    username: user.username,
    is_admin: user.is_admin
  };
  
  const expiration = process.env.JWT_EXPIRATION || '7d';
  return jwt.sign(payload, JWT_SECRET, { expiresIn: expiration });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

module.exports = { generateToken, verifyToken };
