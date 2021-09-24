# Socket.IO event listeners and emitters

- Documentation of Socket listeners, the data they should be receiving and a description of what kind of response the event listeners will give.
- All event listeners require query parameters `clientId`, a UUID.
- `data` in the socket listeners is a JSON object, which is referred to as `Required Payload` throughout the documentation

<br />

# Table of Content

- [How to use](#how-to-use)
- [Room](#room)
  - [room-create](#room-create)
  - [room-join](#room-join)
  - [room-leave](#room-leave)
- [Game](#game)
  - [game-start](#game-start)
  - [game-next-question](#game-next-question)
  - [game-end](#game-end)
  - [game-player-answer-submission](#game-player-answer-submission)
  - [game-player-match-submission](#game-player-match-submission)
  - [game-next-turn](#game-next-turn)
- [Player (Emitters only)](#player-emitters-only)
  - [player-reconnect](#player-reconnect)
  - [player-disconnect](#player-disconnect)

<br />

## How to use

To use the web sockets, on the client side, you first have to establish a connection with the server. This can be done by installing `socket.io-client` library, and setting up a connection `io(<your-server-url>)`. You can attach the `clientId` and as a query param to the connection so that it is sent over everytime.

To trigger and listen to certain events on the client side, you can use `socket.emit(msg, data)` and `socket.on(msg, data)`.
The full documentation can be found [here](https://socket.io/docs/v4/client-api/)

<br />

## Room

<br />

### room-create

```
socket.on('room-create', (data) => {....})
```

#### Description

Event listener that will respond when client decides to create a room, this listener requires the
`username`, in addition to the query parameters.

#### Required Payload Attributes

- `username` - username of the client attempting to create a room.

#### Emitted events

**Success**

- Server will emit `room-join` to the client together with the `gameState` back to the client, indicating that the client can join the room, with the `gameState` in the `LOBBY` phase.

**Failure**

- Server will emit `error-room-create` to the client, together with the error message, indicating an error occured.

<br />

### room-join

```
socket.on('room-join', (data) => {....})
```

#### Description

Event listener that will respond when client decides to join a room, this listener requires the
`username` and `roomCode`, in addition to the query parameters.

#### Required Payload Attributes

- `username` - username of the client attempting to join a room.
- `roomCode` - room ID, which other users can join the room

#### Emitted events

**Success**

- Server will emit `room-join` to the client together with the `gameState` back to the client, indicating that the client can join the room.
- Server will emit `user-join` to all clients in the room together with a JSON object that contains with the updated game state, `gameState` and the clientId of the player joining `clientId`.

**Failure**

- Server will emit `error-room-join` to the client, together with the error message, indicating an error occured.

<br />

### room-leave

```
socket.on('room-leave', (data) => {....})
```

#### Description

Event listener that will respond when client decides to leave a room, this listener requires the
`roomCode`, in addition to the query parameters.

#### Required Payload Attributes

- `roomCode` - room id of the client attempting to leave.

#### Emitted events

**Success**

- Server will emit `room-leave` back to the client, indicating that the client can leave the room.

- Server will also emit a `user-leave` event to announce to all clients in the room which the user left. Attached to the emitted is a JSON object containing `gameState`, the updated gameState and `clientId`, the clientId of the user who left the room.

- If the previous host left, the server will emit a `new-host` event to announce who is the new host. Attached is the `clientId` of the new host.

**Failure**

- Server will emit `error-room-leave` to the client, together with the error message, indicating an error occured.

<br />

## Game

<br />

### game-start

```
socket.on('game-start', (data) => ....)
```

#### Description

Event listener when host of game room decides to start the game. This listener requires 2 attributes in the payload, the `roomCode` of the room starting the game and the chosen question deck id `deckId`

#### Required Payload

- `roomCode` room code of room starting game
- `deckId` id of question deck to use questions from

#### Emitted events

**Success**

- Server will emit `game-next-phase` to the client together with a JSON object containing `gameState`, the game state back to the client, with the game state in the `QUESTIONS` phase

**Failure**

- Server will emit `error-game-start` to the client, together with the error message, indicating an error occured.
  <br />

### game-next-question

```
socket.on('game-next-question', (data) => ....)
```

<br />

#### Description

Event listener when host of game room requests for next question. This listener requires an attribute `roomCode`, the room code of the game requesting for the next question

<br />

#### Required Payload

- `roomCode` room code of room player is joining

<br />

#### Emitted events

**Success**

- Server will emit `game-next-phase` to the client together with a JSON object containing `gameState`, the updated game state, back to the client, with the gamestate in the `QUESTIONS` phase.

**Failure**

- Server will emit `error-game-next-question` to the client, together with the error message, indicating an error occured.

<br />

### game-end

```
socket.on('game-end', (data) => ....)
```

#### Description

Event listener when host of game room requests for next question. This listener requires an attribute `roomCode`, the room code of the game requesting for the next question

#### Required Payload

- `roomCode` room code of the ending game

#### Emitted events

**Success**

- Server will emit `game-next-phase` to the client together with a JSON object containing `gameState`, the updated game state, back to the client, with the game state in the `LOBBY` phase.

**Failure**

- Server will emit `error-game-end` to the client, together with the error message, indicating an error occured.

<br />

### game-player-answer-submission

```
socket.on('game-player-answer-submission', (data) => ....)
```

#### Description

Event listener when player answers the question. This listener require 2 attributes `roomCode` and `answer`, the answer the player has filled up.

#### Required Payload

- `roomCode` room code of the ongoing game
- `answer` the answer the player submitted

#### Emitted events

**Success**

- Server will emit `game-player-ready` to the client with a JSON object containing `gameState`, the updated gameState and `readyClientId`, the player who is now ready

**Failure**

- Server will emit a `error-game-player-answer-submission` to the client, together with the error message, indicating an error occured.

<br />

### game-player-match-submission

```
socket.on('game-player-match-submission', (data) => ....)
```

#### Description

Event listener when player makes a guess to match the player to answer. This listener require 3 attributes `roomCode`, `selectedPlayerId ` and `selectedAnswer`.

#### Required Payload

- `roomCode` room code of the ongoing game
- `selectedPlayerId` the player chosen in the guess
- `selectedAnswer` the answer the player selected in the guess

#### Emitted events

**Success**

- Server will emit `game-next-phase` to the client together with a JSON object containing `gameState` , the updated game state in the `TURN_REVEAL_PHASE` and `alreadyGuessed`, indicating if a player's answer has already been guessed by someone.

**Failure**

- Server will emit `error-game-player-match-submission` to the client, together with the error message, indicating an error occured.

<br />

### game-next-turn

```
socket.on('game-next-turn', (data) => ....)
```

#### Description

- Event listener when for when the game goes to the next turn and guesser. This listener require 1 attribute `roomCode`.
- An async timer of 30 seconds will also be fired, in which if the current game state is still in the `TURN_GUESS` phase, it will send a `game-next-phase` event to all clients to force a change to that phase.

#### Required Payload

- `roomCode` room code of the ongoing game

#### Emitted events

**Success**

- If there is 1 answer left and the answer belongs to the current guesser, server will emit a `game-next-phase` to the client to together with a JSON object containing `gameState`, the updated game state in the `TURN_REVEAL_PHASE` and `alreadyGuessed`, a boolean value if the player answer has already been guessed.

- If there is 1 or more answer left to match, server will emit `game-next-phase` to the client together with a JSON object containing `gameState`, the updated game state, with the game state in the `TURN_GUESS_PHASE`.

- If there is 0 answers left to guess, the server will emit `game-next-phase` to the client to together with a JSON object containing `gameState`, the updated game state, with the game state in the `SCOREBOARD_PHASE`.

**Failure**

- Server will emit `error-game-next-turn` to the client, together with the error message, indicating an error occured.

<br />

## Player (Emitters only)

<br />

### player-reconnect

```
socket.emit('player-reconnect', (payload) => ....)
```

#### Description

Emitted when a player reconnects to the server while previously in the middle of a game. It is emitted to all players in the room.

#### Payload

The emitted payload is JSON object containing 2 attributes

- `gameState` representing the updated game sate
- `clientId` the clientId of the player who reconnected

<br />

### player-disconnect

```
socket.emit('player-disconnect', (payload) => ....)
```

#### Description

Emitted when a player disconnects from the server while in the middle of a game. It is emitted to all players in the room.

#### Payload

The emitted payload is JSON object containing 2 attributes

- `gameState` representing the updated game sate
- `clientId` the clientId of the player who disconnected

<!--
<br />

### Title
```
socket.on('game-', (data) => ....)
'```

<br />

### Description

<br />

### Required Payload

<br />

### Emitted events

**Success**

**Failure**

<br />
-->
