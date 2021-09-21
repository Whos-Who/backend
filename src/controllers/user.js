import { StatusCodes } from 'http-status-codes';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { TOKEN_KEY } from '../const/const';
import User from '../models/User';

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!(email && password)) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .send('All inputs are required!');
    }

    const user = await User.findOne({
      where: {
        email: email
      }
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(StatusCodes.UNAUTHORIZED).send('Invalid credientials!');
    }

    const payload = {
      userId: user.id
    };

    const options = {
      expiresIn: '1h'
    };

    const token = jwt.sign(payload, TOKEN_KEY, options);
    res.status(StatusCodes.OK).json({
      user: user,
      token: token
    });
  } catch (err) {
    next(err);
  }
}

async function register(req, res, next) {
  try {
    const { username, email, password } = req.body;

    if (!(username && email && password)) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .send('All inputs are required!');
    }

    const oldUser = await User.findOne({
      where: {
        email: email
      }
    });

    if (oldUser) {
      return res.status(StatusCodes.CONFLICT).send('User already exists!');
    }

    const encryptedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      ...req.body,
      password: encryptedPassword
    });

    const payload = {
      id: user.id
    };

    const options = {
      expiresIn: '1h'
    };

    const token = jwt.sign(payload, TOKEN_KEY, options);

    res.status(StatusCodes.CREATED).json({ user: user, token: token });
  } catch (err) {
    next(err);
  }
}

async function retrieveUser(req, res, next) {
  try {
    const user = await User.findByPk(req.params.id);
    if (user === null) {
      return res.status(StatusCodes.NOT_FOUND).send('User not found!');
    }
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

async function indexUser(req, res, next) {
  try {
    const users = await User.findAll({ order: [['id', 'ASC']] });
    res.status(StatusCodes.OK).json(users);
  } catch (err) {
    next(err);
  }
}

async function showUser(req, res, next) {
  try {
    res.status(StatusCodes.OK).json(req.user);
  } catch (err) {
    next(err);
  }
}

async function createUser(req, res, next) {
  try {
    const user = await User.create(req.body);
    res.status(StatusCodes.CREATED).json(user);
  } catch (err) {
    next(err);
  }
}

async function updateUser(req, res, next) {
  try {
    const user = await req.user.update(req.body);
    res.status(StatusCodes.OK).json(user);
  } catch (err) {
    next(err);
  }
}

async function destroyUser(req, res, next) {
  try {
    await req.user.destroy();
    res.status(StatusCodes.OK).end();
  } catch (err) {
    next(err);
  }
}

export const loginFuncs = [login];
export const registerFuncs = [register];
export const indexUserFuncs = [indexUser];
export const showUserFuncs = [retrieveUser, showUser];
export const createUserFuncs = [createUser];
export const updateUserFuncs = [retrieveUser, updateUser];
export const destroyUserFuncs = [retrieveUser, destroyUser];
