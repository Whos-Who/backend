import {
  addPlayerAnswer,
  startGame,
  switchToQuestionsPhase,
  endTurnRevealPhase,
  endGame,
  switchToTurnRevealPhase,
  forceTurnRevealPhase
} from '../handlers/game';
import {
  GUESS_TIMER_INTERVAL,
  TURN_GUESS_PHASE,
  TURN_REVEAL_PHASE
} from '../../const/game';
import { updatePlayerActivity } from '../../utils/utils';

const roomToTimerMap = {};

const intializeGameListeners = (socket, io) => {
  // Retrieves from socket query parameters
  const { clientId } = socket.handshake.query;
  const socketId = socket.id;

  // Separate out game-start and question-phase due to the need to pull questions at the start
  socket.on('game-start', async (data) => {
    try {
      const { roomCode, deckId } = data;

      const gameState = await startGame(roomCode, deckId);

      // Tell client game has begun and proceed to the question phase
      io.to(roomCode).emit('game-next-phase', { gameState });

      await updatePlayerActivity(clientId, socketId, roomCode);
    } catch (err) {
      socket.emit('error-game-start', err.message);
      console.log('game start error occured', err);
    }
  });

  // Used when player licks next question
  socket.on('game-next-question', async (data) => {
    try {
      const { roomCode } = data;

      const gameState = await switchToQuestionsPhase(roomCode);

      // Tell client to proceed to open question and let user answer
      io.to(roomCode).emit('game-next-phase', { gameState });
      await updatePlayerActivity(clientId, socketId, roomCode);
    } catch (err) {
      socket.emit('error-game-next-question', err.message);
      console.log('game next question error occured', err);
    }
  });

  socket.on('game-end', async (data) => {
    try {
      const { roomCode } = data;

      const gameState = await endGame(roomCode);
      // Tell client game has ended and bring players back to the lobby
      io.to(roomCode).emit('game-next-phase', { gameState });
      await updatePlayerActivity(clientId, socketId, roomCode);
    } catch (err) {
      socket.emit('error-game-end', err.message);
      console.log('game end error occured', err);
    }
  });

  socket.on('game-player-answer-submission', async (data) => {
    try {
      const { roomCode, answer } = data;

      const gameState = await addPlayerAnswer(roomCode, clientId, answer);

      console.log(clientId, 'SUBMIT ANSWER', answer);

      io.to(roomCode).emit('game-player-ready', {
        gameState,
        readyClientId: clientId
      });
      await updatePlayerActivity(clientId, socketId, roomCode);
    } catch (err) {
      socket.emit('error-game-player-answer-submission', err.message);
      console.log('game player answer submission error occured', err);
    }
  });

  socket.on('game-player-match-submission', async (data) => {
    try {
      const { roomCode, selectedPlayerId, selectedAnswer } = data;
      const roomTimer = roomToTimerMap[roomCode];
      console.log('Obtained timer', roomTimer);

      clearTimeout(roomTimer);
      delete roomToTimerMap[roomCode];
      console.log('Timer Map', roomToTimerMap);

      const [gameState, alreadyGuessed] = await switchToTurnRevealPhase(
        roomCode,
        selectedPlayerId,
        selectedAnswer
      );

      console.log('SUBMIT MATCH', '- UPDATED GAME STATE', gameState);

      io.to(roomCode).emit('game-next-phase', { gameState, alreadyGuessed });
      await updatePlayerActivity(clientId, socketId, roomCode);
    } catch (err) {
      socket.emit('error-game-player-match-submission', err.message);
      console.log('game player match submission error occured', err);
    }
  });

  socket.on('game-next-turn', async (data) => {
    try {
      const { roomCode } = data;

      const gameState = await endTurnRevealPhase(roomCode);
      const nextGuesser = gameState.currAnswerer;
      let body = { gameState };
      if (gameState.phase === TURN_REVEAL_PHASE) {
        const newBody = {
          ...body,
          alreadyGuessed: false
        };
        body = newBody;
      }
      console.log('NEXT TURN', 'UPDATED  GAME STATE', gameState);
      io.to(roomCode).emit('game-next-phase', body);

      // If gamestate is in guessing phase, start timer
      if (gameState.phase === TURN_GUESS_PHASE) {
        const timer = setTimeout(
          forceTurnRevealPhase(nextGuesser, roomCode, io),
          GUESS_TIMER_INTERVAL
        );
        roomToTimerMap[roomCode] = timer;
        console.log('Timer Map', roomToTimerMap);
      }
      await updatePlayerActivity(clientId, socketId, roomCode);
    } catch (err) {
      socket.emit('error-game-next-turn', err.message);
      console.log('game next turn error occured', err);
    }
  });
};

export { intializeGameListeners };
