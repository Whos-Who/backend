import { StatusCodes } from 'http-status-codes';
import createError from 'http-errors';

var User = require('../models').User;

async function retrieveUser(req, res, next) {
  try {
    const user = await User.findByPk(req.params.id);
    if (user === null) {
      throw createError(StatusCodes.NOT_FOUND, 'User not found!');
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

export const indexUserFuncs = [indexUser];
export const showUserFuncs = [retrieveUser, showUser];
export const createUserFuncs = [createUser];
export const updateUserFuncs = [retrieveUser, updateUser];
export const destroyUserFuncs = [retrieveUser, destroyUser];
