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


Tracking questions and guessing order for a particular game

questions-<roomId>: List / Deque of questions
guessing-order-<roomId>: List / Deque of clientIds


Might need a user to connection status mapping, called a presence server for the reconnection, but let me do more research on it. Thinking of something like, where if player key is present but socket id changes -> reconnection occurred, not a new user joining a new room:

player-<clientId>:
    socketId: string
    roomId: string

```
