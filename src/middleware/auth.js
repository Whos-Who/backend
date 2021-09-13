import jwt from 'jsonwebtoken';
import { StatusCodes } from 'http-status-codes';
import createError from 'http-errors';
import { TOKEN_KEY } from '../const/const';
import User from '../models/User';

const verifyToken = async (req, res, next) => {
  const token = req.header('x-auth-token');

  if (!token) {
    throw createError(
      StatusCodes.FORBIDDEN,
      'Token is required for authentication!'
    );
  }

  try {
    const decoded = jwt.verify(token, TOKEN_KEY);
    req.userId = decoded.userId;
  } catch (err) {
    throw createError(StatusCodes.UNAUTHORIZED, 'Invalid token!');
  }

  next();
};

export default verifyToken;
