import jwt from 'jsonwebtoken';
import { StatusCodes } from 'http-status-codes';
import createError from 'http-errors';
import { TOKEN_KEY } from '../const/const';
import { ON_AUTH } from '../const/const';

const verifyToken = async (req, res, next) => {
  try {
    if (!ON_AUTH) {
      next();
      return;
    }

    const token = req.header('x-auth-token');

    if (!token) {
      next();
      return;
    }

    try {
      const decoded = jwt.verify(token, TOKEN_KEY);
      req.userId = decoded.userId;
    } catch (err) {
      throw createError(StatusCodes.UNAUTHORIZED, 'Invalid token!');
    }
    next();
  } catch (err) {
    next(err);
  }
};

export default verifyToken;
