import jwt from 'jsonwebtoken';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Splits out the 'Bearer' flag schema

  if (!token) {
    return res.status(401).json({ success: false, error: 'Access token initialization signature missing.' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (error, decodedPayload) => {
    if (error) {
      return res.status(403).json({ success: false, error: 'Access token signature validation failure.' });
    }

    req.user = { id: decodedPayload.userId };
    next();
  });
};