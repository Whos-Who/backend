# Socket.IO event listeners

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
- [Misc](#misc)

<br />

## How to use

To use the web sockets, on the client side, you first have to establish a connection with the server. This can be done by installing `socket.io-client` library, and setting up a connection `io(<your-server-url>)`. You can attach the `clientId` and as a query param to the connection so that it is sent over everytime.

To trigger and listen to certain events on the client side, you can use `socket.emit(msg, data)` and `socket.on(msg, data)`.
The full documentation can be found [here](https://socket.io/docs/v4/client-api/)

I would also recommend that you set up the Backend repository locally to test the events, as you can clear the Redis storage by hitting the following endpoints:

- `POST /reset` to clear all the game states in your local Redis
- `DELETE /reset/:roomid` to clear all game state related to `roomid`

<br />

## Room

<br />

### room-create

```
socket.on('room-create', (data) => {....})
```
<br />

### Description

Event listener that will respond when client decides to create a room, this listener requires the
`username`, in addition to the query parameters.

<br />

### Required Payload Attributes

`username` - username of the client attempting to create a room.

<br />

### Response

**Success**

Server will emit a `room-join` to the client together with the `gameState` back to the client, indicating that the client can join the room.

**Failure**

Server will emit a `error-room-create` to the client, together with the error message `err`, indicating an error occured.

<br />

### room-join

```
socket.on('room-join', (data) => {....})
```

<br />

### Description

Event listener that will respond when client decides to join a room, this listener requires the
`username` and `roomCode`, in addition to the query parameters.

<br />

### Required Payload Attributes

`username` - username of the client attempting to join a room.
`roomCode` - room ID, which other users can join the room

<br />

### Response

**Success**

Server will emit a `room-join` to the client together with the `gameState` back to the client, indicating that the client can join the room.

**Failure**

Server will emit a `error-room-join` to the client, together with the error message `err`, indicating an error occured.

<br />

### room-leave

```
socket.on('room-leave', (data) => {....})
```

<br />

### Description

Event listener that will respond when client decides to leave a room, this listener requires the
`roomCode`, in addition to the query parameters.

<br />

### Required Payload Attributes

`roomCode` - room id of the client attempting to leave.

<br />

### Response

**Success**

Server will emit a `room-leave` to the client together with the `gameState` back to the client, indicating that the client can join the room.

Server will also emit a `user-leave` event to announce to the all clients in the room which user had left. Response is JSON object with the following attributes:

- `clientId` - clientId of user who left
- `gameState` - updated gameState

If the previous host left, the server will emit a `new-host` event to announce who is the new host. Response is `clientId` - the clientId of user who left.

**Failure**

Server will emit a `error-room-leave` to the client, together with the error message `err`, indicating an error occured.

## Game

## Misc

<!--
<br />
Template, paste here for now

### Title
'''
'''
### Description
### Required Payload
### Response
**Success**
**Failure**
-->
