import jwt from 'jsonwebtoken';
import config from '../config.js';

const authMiddleware = (req, res, next) => {
  const token = req.cookies.token;

  if (!token) return res.status(401).json({ error: 'No autorizado' });

  try {
    const user = jwt.verify(token, config.secret);
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido' });
  }
};

export default authMiddleware;