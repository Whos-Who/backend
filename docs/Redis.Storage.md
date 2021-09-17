# Redis Storage

Currently, redis storage structure is planned to be as such

```
Tracking Game State for a room

room-<roomId>:
  roomCode: string
  phase: enum(lobby,.....)
  host: string
  currQuestion: string
  currAnswerer: string
  playerCount: number
  questionsLeft: number,
  selectedPlayerId: string,
  selectedAnswer: string,
  players: map<clientId,PlayerState>

PlayerState is a map of clientId to listed attributes

clientId - {
  username: string
  connected: boolean
  score: number
  currAnswer: {
    value: string,
    isGuessed: boolean
  }
}


Tracking questions for a particular game

questions-<roomId>: List / Deque of questions


Tracking guessing order for a particular game

guessing-order-<roomId>: List / Deque of clientIds


Track player activity when player joins game, used for reconnecting to gameroom

player-activity-<clientId>:
    socketId: string
    roomId: string

```
