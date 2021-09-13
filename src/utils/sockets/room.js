import { LOBBY_PHASE } from '../../const/game';

const canJoin = (gameState, clientId) => {
  // Return true if game has not started or player was part of game but trying to reconnect
  return gameState.phase == LOBBY_PHASE || gameState['players'][clientId];
};

export { canJoin };
