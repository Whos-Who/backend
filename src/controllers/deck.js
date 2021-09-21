import { StatusCodes } from 'http-status-codes';
import { Op } from 'sequelize';

import Deck from '../models/Deck';
import Question from '../models/Question';

async function retrieveDeck(req, res, next) {
  try {
    const deck = await Deck.findByPk(req.params.id, {
      include: Question
    });
    if (deck === null) {
      return res.status(StatusCodes.NOT_FOUND).send('Deck not found!');
    }
    req.deck = deck;
    next();
  } catch (err) {
    next(err);
  }
}

async function indexDeck(req, res, next) {
  try {
    const userId = req.userId;
    const decks = await Deck.findAll({
      where: { [Op.or]: [{ userId: userId || null }, { userId: null }] },
      order: [['id', 'ASC']]
    });
    res.status(StatusCodes.OK).json(decks);
  } catch (err) {
    next(err);
  }
}

async function showDeck(req, res, next) {
  try {
    res.status(StatusCodes.OK).json(req.deck);
  } catch (err) {
    next(err);
  }
}

async function createDeck(req, res, next) {
  try {
    const userId = req.userId;
    const deck = await Deck.create({ ...req.body, userId: userId });
    res.status(StatusCodes.CREATED).json(deck);
  } catch (err) {
    next(err);
  }
}

async function updateDeck(req, res, next) {
  try {
    const deck = await req.deck.update(req.body);
    res.status(StatusCodes.OK).json(deck);
  } catch (err) {
    next(err);
  }
}

async function destroyDeck(req, res, next) {
  try {
    await req.deck.destroy();
    res.status(StatusCodes.OK).end();
  } catch (err) {
    next(err);
  }
}

export const indexDeckFuncs = [indexDeck];
export const showDeckFuncs = [retrieveDeck, showDeck];
export const createDeckFuncs = [createDeck];
export const updateDeckFuncs = [retrieveDeck, updateDeck];
export const destroyDeckFuncs = [retrieveDeck, destroyDeck];
