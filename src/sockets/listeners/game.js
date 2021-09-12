import {
  getGameState,
  parseGameState,
  formatGameState,
  cleanUpGameState,
  updateGameStateInServer
} from '../handlers/room';
import { shuffle } from '../../utils/utils';
import {
  addGuessingOrder,
  addQuestions,
  getNextQuestion,
  removeGuessingOrder,
  removeQuestions
} from '../handlers/game';

import Question from '../../models/Question';
import { QUESTION_PHASE } from '../../const/game';

const intializeGameListeners = (socket, io) => {
  // Retrieves from socket query parameters
  const { clientId } = socket.handshake.query;
  const socketId = socket.id;

  // Separate out game-start and question-phase due to the need to pull questions at the start
  socket.on('game-start', async (data) => {
    try {
      const { roomCode, deckId } = data;

      let questions = await Question.findAll({
        where: {
          deckId
        },
        attributes: ['question'],
        raw: true
      });

      questions = questions.map((element) => element['question']);
      const numQuestions = questions.length;
      shuffle(questions);

      const gameState = await Promise.all([
        addQuestions(roomCode, questions),
        getGameState(roomCode)
      ]).then((res) => res[1]);

      console.log(gameState);

      // await addQuestions(roomCode, questions);

      // const gameState = await getGameState(roomCode);
      const parsedGameState = parseGameState(gameState);
      const players = Object.keys(parsedGameState['players']);
      shuffle(players);

      const nextQuestion = await Promise.all([
        addGuessingOrder(roomCode, players),
        getNextQuestion(roomCode)
      ]).then((res) => res[1]);

      // await addGuessingOrder(roomCode, players);

      // const nextQuestion = await getNextQuestion(roomCode);

      const updatedGameState = {
        ...parsedGameState,
        phase: QUESTION_PHASE,
        currQuestion: nextQuestion,
        questionCount: numQuestions - 1
      };

      console.log('UPDATED GAME STATE', updatedGameState);

      const formattedGameState = formatGameState(updatedGameState);
      await updateGameStateInServer(formattedGameState);

      // Tell client game has begun and proceed to the question phase
      console.log(roomCode);
      io.to(roomCode).emit('game-phase-question', updatedGameState);
    } catch (err) {
      socket.emit('error-game-start', err);
      console.log('game start error occured', err);
      throw err;
    }
  });

  // Used when player licks next question
  socket.on('game-next-question', async (data) => {
    try {
      const { roomCode } = data;

      const [nextQuestion, gameState] = await Promise.all([
        getNextQuestion(roomCode),
        getGameState(roomCode)
      ]).then((res) => {
        return res;
      });
      // const gameState = await getGameState(roomCode);
      const parsedGameState = parseGameState(gameState);

      // No more questions, end game and emit final state (with the scores)
      // Might need to track question count if FE won't show that Next Question anymore
      if (!parsedGameState.questionCount) {
        console.log('No questions left!');
        io.to(roomCode).emit('game-end', parsedGameState);
        return;
      }

      const players = Object.keys(parsedGameState['players']);
      shuffle(players);

      const updatedGameState = {
        ...parsedGameState,
        phase: QUESTION_PHASE,
        currQuestion: nextQuestion,
        questionCount: parsedGameState.questionCount - 1
      };

      console.log('UPDATED GAME STATE', updatedGameState);
      const formattedGameState = formatGameState(updatedGameState);

      await Promise.all([
        updateGameStateInServer(formattedGameState),
        addGuessingOrder(roomCode, players)
      ]);
      // await updateGameStateInServer(formattedGameState);
      // await addGuessingOrder(roomCode, players);

      // Tell client to proceed to open question and let user answer
      io.to(roomCode).emit('game-phase-question', updatedGameState);
    } catch (err) {
      socket.emit('error-game-next-question', err);
      console.log('game next question error occured', err);
      throw err;
    }
  });

  socket.on('game-end', async (data) => {
    try {
      const { roomCode } = data;

      // Remove exisiting question and getting order states in Redis
      const gameState = await Promise.all(
        getGameState(roomCode),
        removeQuestions(roomCode),
        removeGuessingOrder(roomCode)
      ).then((res) => {
        console.log(res);
        return res[0];
      });
      // await removeQuestions(roomCode);
      // await removeGuessingOrder(roomCode);

      // const gameState = await getGameState(roomCode);
      console.log('GAAAME', gameState);
      const parsedGameState = parseGameState(gameState);

      console.log('PARSED', parsedGameState);

      // Send clean game state, since they are brought back to lobby where they can play again
      const cleanGameState = cleanUpGameState(parsedGameState);

      const formattedGameState = formatGameState(cleanGameState);
      await updateGameStateInServer(formattedGameState);

      console.log('CLEAN STATE', cleanGameState);
      // Tell client game has ended and bring players back to the lobby
      socket.emit('game-end', cleanGameState);
    } catch (err) {
      socket.emit('error-game-end', err);
      console.log('game end error occured', err);
      throw err;
    }
  });

  // socket.on('room-create', async (data) => {
  //   try {
  //     const { username } = data;

  //     const roomCode = socket.id;
  //     const gameState = createRoom(roomCode, clientId, username);

  //     // Tell client room is created and he can join room
  //     socket.emit('room-join', gameState);
  //     socket.join(gameState);
  //   } catch (err) {
  //     socket.emit('error-room-create', err);
  //     console.log('create room error occured', err);
  //     throw err;
  //   }
  // });
};

export { intializeGameListeners };
