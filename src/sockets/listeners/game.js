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
  getNextGuesser,
  getNextQuestion,
  removeGuessingOrder,
  removeQuestions,
  updateCorrectGuess,
  prepareForNextQuestion,
  getRemainingAnswers
} from '../handlers/game';

import Question from '../../models/Question';
import {
  QUESTION_PHASE,
  TURN_GUESS_PHASE,
  TURN_REVEAL_PHASE
} from '../../const/game';

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
        questionsLeft: numQuestions - 1
      };

      console.log('START GAME', '- UPDATED GAME STATE', updatedGameState);

      const formattedGameState = formatGameState(updatedGameState);
      await updateGameStateInServer(formattedGameState);

      // Tell client game has begun and proceed to the question phase
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
      if (!parsedGameState.questionsLeft) {
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
        questionsLeft: parsedGameState.questionsLeft - 1
      };

      console.log('NEXT QUESTION', '- UPDATED GAME STATE', updatedGameState);
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
      const gameState = await Promise.all([
        getGameState(roomCode),
        removeQuestions(roomCode),
        removeGuessingOrder(roomCode)
      ]).then((res) => {
        return res[0];
      });

      const parsedGameState = parseGameState(gameState);

      // Send clean game state, since they are brought back to lobby where they can play again
      const cleanGameState = cleanUpGameState(parsedGameState);

      const formattedGameState = formatGameState(cleanGameState);
      await updateGameStateInServer(formattedGameState);

      console.log('END GAME', '- UPDATED (CLEAN) GAME STATE', cleanGameState);
      // Tell client game has ended and bring players back to the lobby
      socket.emit('game-close', cleanGameState);
    } catch (err) {
      socket.emit('error-game-end', err);
      console.log('game end error occured', err);
      throw err;
    }
  });

  socket.on('game-answer-submission', async (data) => {
    try {
      const { roomCode, selectedPlayerId, selectedAnswer } = data;

      const gameState = await getGameState(roomCode);
      const parsedGameState = parseGameState(gameState);

      const result = selectedPlayerId == selectedAnswer;

      let updatedGameState;

      if (result) {
        updatedGameState = {
          ...parsedGameState,
          phase: TURN_REVEAL_PHASE,
          selectedPlayerId,
          selectedAnswer,
          players: updateCorrectGuess(
            gameState.currAnswerer,
            parsedGameState.players,
            selectedAnswer
          )
        };
      } else {
        updatedGameState = {
          ...parsedGameState,
          phase: TURN_REVEAL_PHASE,
          selectedPlayerId,
          selectedAnswer
        };
      }

      console.log('SUBMIT ANS', '- UPDATED GAME STATE', updatedGameState);

      const formattedGameState = formatGameState(updatedGameState);
      await updateGameStateInServer(formattedGameState);

      io.to(roomCode).emit('game-phase-turn-reveal', updatedGameState, result);
    } catch (err) {
      socket.emit('error-answer-submission', err);
      console.log('submit answer error occured', err);
      throw err;
    }
  });

  socket.on('game-next-turn', async (data) => {
    try {
      const { roomCode } = data;

      const gameState = await getGameState(roomCode);
      const parsedGameState = parseGameState(gameState);

      // If no more turns left, should bring to scoreboard
      if (getRemainingAnswers(parsedGameState.players) <= 1) {
        try {
          const updatedGameState = prepareForNextQuestion(parsedGameState);

          const formattedGameState = formatGameState(updatedGameState);
          await updateGameStateInServer(formattedGameState);
          // Prepare gameState for next question

          console.log('SCOREBOARD', '- UPDATED  GAME STATE', updatedGameState);
          io.to(roomCode).emit('game-phase-scoreboard', parsedGameState);
        } catch (err) {
          socket.emit('error-game-scoreboard', err);
          console.log('game score board error occured', err);
          throw err;
        }

        return;
      }

      const nextGuesser = await getNextGuesser(roomCode);

      const updatedGameState = {
        ...parsedGameState,
        phase: TURN_GUESS_PHASE,
        currAnswerer: nextGuesser
      };

      const formattedGameState = formatGameState(updatedGameState);
      await updateGameStateInServer(formattedGameState);

      console.log('NEXT TURN', 'UPDATED  GAME STATE', updatedGameState);
      io.to(roomCode).emit('game-phase-turn-guess', updatedGameState);

      // Start async timer
      setTimeout(async () => {
        const gameState = await getGameState(roomCode);
        const parsedGameState = parseGameState(gameState);

        // If user did not answer in time, set this
        if (parseGameState.gameState != TURN_REVEAL_PHASE) {
          const unansweredGameState = {
            ...parsedGameState,
            phase: TURN_REVEAL_PHASE,
            selectedPlayerId: '',
            selectedAnswer: ''
          };

          const formattedGameState = formatGameState(unansweredGameState);
          await updateGameStateInServer(formattedGameState);
          console.log('TIMES UP!');
          io.to(roomCode).emit('game-phase-turn-reveal', unansweredGameState);
        }
      }, 10000);

      io.to(roomCode).emit('game-phase-turn-guess', updatedGameState);
    } catch (err) {
      socket.emit('error-game-next-turn', err);
      console.log('game next turn error occured', err);
      throw err;
    }
  });

  // socket.on('game-phase-guess-turn-timeout', async (data) => {
  //   const { gameState } = data;

  //   const formattedGameState = formatGameState(gameState);
  //   await updateGameStateInServer(formattedGameState);

  //   io.to(roomCode).emit(
  //     'game-phase-turn-reveal',
  //     updatedGameState,
  //     'Time out!'
  //   );
  // });

  // socket.on('game-scores', async (data) => {
  //   try {
  //     const { roomCode } = data;

  //     const gameState = await getGameState(roomCode);
  //     const parsedGameState = parseGameState(gameState);

  //     const updatedGameState = prepareForNextQuestion(parsedGameState);
  //     console.log('UPDATED', updatedGameState);

  //     const formattedGameState = formatGameState(updatedGameState);
  //     await updateGameStateInServer(formattedGameState);
  //     // Prepare gameState for next question

  //     console.log('SCOREBOARD', '- UPDATED  GAME STATE', updatedGameState);
  //     io.to(roomCode).emit('game-phase-scores', parsedGameState);
  //   } catch (err) {
  //     socket.emit('error-room-create', err);
  //     console.log('create room error occured', err);
  //     throw err;
  //   }
  // });

  // TO -DO
  // TIMER
};

export { intializeGameListeners };
