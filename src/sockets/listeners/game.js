import {
  getGameState,
  parseGameState,
  updateGameStateInServer,
  formatGameState
} from '../handlers/room';
import { shuffle } from '../../utils/utils';
import {
  addGuessingOrderToSever,
  addQuestionsToServer,
  getNextQuestion
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
      shuffle(questions);

      await addQuestionsToServer(roomCode, questions);

      const gameState = await getGameState(roomCode);
      const parsedGameState = parseGameState(gameState);
      const players = Object.keys(parsedGameState['players']);
      shuffle(players);

      console.log(players);

      await addGuessingOrderToSever(roomCode, players);

      const nextQuestion = await getNextQuestion(roomCode);

      const updatedGameState = {
        ...parsedGameState,
        phase: QUESTION_PHASE,
        currQuestion: nextQuestion
      };

      console.log('UPDATED GAME STATE', updatedGameState);
      const formattedGameState = formatGameState(updatedGameState);
      await updateGameStateInServer(formattedGameState);

      // Tell client room is created and he can join room
      console.log(roomCode);
      io.to(roomCode).emit('game-next-question', updatedGameState);
    } catch (err) {
      socket.emit('error-room-create', err);
      console.log('create room error occured', err);
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
