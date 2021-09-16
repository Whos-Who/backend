import {
  getAndParseGameState,
  formatAndUpdateGameState
} from '../handlers/room';
import {
  addPlayerAnswer,
  startGame,
  switchToQuestionsPhase,
  switchToTurnGuessPhase,
  endGame,
  switchToTurnRevealPhase
} from '../handlers/game';
import { TURN_GUESS_PHASE, TURN_REVEAL_PHASE } from '../../const/game';

const intializeGameListeners = (socket, io) => {
  // Retrieves from socket query parameters
  const { clientId } = socket.handshake.query;
  const socketId = socket.id;

  // Separate out game-start and question-phase due to the need to pull questions at the start
  socket.on('game-start', async (data) => {
    try {
      const { roomCode, deckId } = data;

      const gameState = startGame(roomCode, deckId);

      // Tell client game has begun and proceed to the question phase
      io.to(roomCode).emit('game-phase-question', gameState);
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

      const gameState = switchToQuestionsPhase(roomCode);

      // Tell client to proceed to open question and let user answer
      io.to(roomCode).emit('game-phase-question', gameState);
    } catch (err) {
      socket.emit('error-game-next-question', err);
      console.log('game next question error occured', err);
      throw err;
    }
  });

  socket.on('game-end', async (data) => {
    try {
      const { roomCode } = data;

      const gameState = endGame(roomCode);
      // Tell client game has ended and bring players back to the lobby
      io.to(roomCode).emit('game-close', gameState);
    } catch (err) {
      socket.emit('error-game-end', err);
      console.log('game end error occured', err);
      throw err;
    }
  });

  socket.on('game-player-answer-submission', async (data) => {
    try {
      const { roomCode, answer } = data;

      const gameState = await addPlayerAnswer(roomCode, clientId, answer);

      io.to(roomCode).emit('game-player-ready', {
        gameState,
        readyClientId: clientId
      });
    } catch (err) {
      socket.emit('error-game-player-answer-submission', err);
      console.log('game player answer submission error occured', err);
      throw err;
    }
  });

  socket.on('game-player-match-submission', async (data) => {
    try {
      const { roomCode, selectedPlayerId, selectedAnswer } = data;

      const gameState = await switchToTurnRevealPhase(
        roomCode,
        selectedPlayerId,
        selectedAnswer
      );

      console.log('SUBMIT MATCH', '- UPDATED GAME STATE', gameState);

      io.to(roomCode).emit('game-phase-turn-reveal', gameState);
    } catch (err) {
      socket.emit('error-game-player-match-submission', err);
      console.log('game player match submission error occured', err);
      throw err;
    }
  });

  socket.on('game-next-turn', async (data) => {
    try {
      const { roomCode } = data;

      const gameState = await switchToTurnGuessPhase(roomCode, socket, io);

      console.log('NEXT TURN', 'UPDATED  GAME STATE', gameState);
      io.to(roomCode).emit('game-phase-turn-guess', gameState);

      // Start async timer
      setTimeout(async () => {
        const gameState = await getAndParseGameState(roomCode);
        // If user did not answer in time, set this
        if (gameState.gameState != TURN_REVEAL_PHASE) {
          const unansweredGameState = {
            ...gameState,
            phase: TURN_REVEAL_PHASE,
            selectedPlayerId: '',
            selectedAnswer: ''
          };

          await formatAndUpdateGameState(unansweredGameState);
          console.log('TIMES UP!');
          io.to(roomCode).emit('game-phase-turn-reveal', unansweredGameState);
        }
      }, 30000);
    } catch (err) {
      socket.emit('error-game-next-turn', err);
      console.log('game next turn error occured', err);
      throw err;
    }
  });
};

export { intializeGameListeners };
