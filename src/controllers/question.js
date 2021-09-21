import { StatusCodes } from 'http-status-codes';

import Question from '../models/Question';

async function retrieveQuestion(req, res, next) {
  try {
    const question = await Question.findByPk(req.params.id);
    if (question === null) {
      return res.status(StatusCodes.NOT_FOUND).send('Question not found!');
    }
    req.question = question;
    next();
  } catch (err) {
    next(err);
  }
}

async function indexQuestion(req, res, next) {
  try {
    const question = await Question.findAll({ order: [['id', 'ASC']] });
    res.status(StatusCodes.OK).json(question);
  } catch (err) {
    next(err);
  }
}

async function showQuestion(req, res, next) {
  try {
    res.status(StatusCodes.OK).json(req.question);
  } catch (err) {
    next(err);
  }
}

async function createQuestion(req, res, next) {
  try {
    const question = await Question.create(req.body);
    res.status(StatusCodes.CREATED).json(question);
  } catch (err) {
    next(err);
  }
}

async function updateQuestion(req, res, next) {
  try {
    const question = await req.question.update(req.body);
    res.status(StatusCodes.OK).json(question);
  } catch (err) {
    next(err);
  }
}

async function destroyQuestion(req, res, next) {
  try {
    await req.question.destroy();
    res.status(StatusCodes.OK).end();
  } catch (err) {
    next(err);
  }
}

export const indexQuestionFuncs = [indexQuestion];
export const showQuestionFuncs = [retrieveQuestion, showQuestion];
export const createQuestionFuncs = [createQuestion];
export const updateQuestionFuncs = [retrieveQuestion, updateQuestion];
export const destroyQuestionFuncs = [retrieveQuestion, destroyQuestion];
