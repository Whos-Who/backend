# Socket.IO event listeners

Documentation of Socket listeners, the data they should be receiving and a description of the client is supposed to use it. All event listeners require query parameters `clientId`, a UUID.


# Table of Content
- [How to use](#How to use)
- [Room](#room)
  - [room-create](#room-create)
  - [room-join](#room-join)
  - [room-leave](#room-leave)
- [Game](#game)
- [Misc](#misc)

## How to use
To use the web sockets, on the client side, you first have to establish a connection with the server. This can be done by installing `socket.io-client` library, and setting up a connection `io(<your-server-url>)`. You can attach the `clientId` and as a query param to the connection so that it is sent over everytime.

To trigger and listen to certain events on the client side, you can use `socket.emit(msg, data)` and `socket.on(msg, data)`.
The full documentation can be found [here](https://socket.io/docs/v4/client-api/)

I would also recommend that you set up the Backend repository locally to test the events, as you can clear the Redis storage with the `FLUSHALL` command using `redis-cli`, if there happens to be bugs / missing data sent while implementing features.

## Room

### room-create

```
socket.emit('room-create', (data) => {....})
```

### Description

Event listener that will respond when client decides to create a room, this listener requires the
`username`, in addition to the query parameters.

### Required Payload

`username` - username of the client attempting to create a room.

### Response

**Success**

Server will emit a `room-join` to the client together with the `gameState` back to the client, indicating that the client can join the room.

**Failure**

Server will emit a `error-room-create` to the client, together with the error message `err`, indicating an error occured.

### room-join

```
socket.emit('room-join', (data) => {....})
```

### Description

Event listener that will respond when client decides to join a room, this listener requires the
`username` and `roomCode`, in addition to the query parameters.

### Required Payload

`username` - username of the client attempting to join a room.
`roomCode` - room ID, which other users can join the room

### Response

**Success**

Server will emit a `room-join` to the client together with the `gameState` back to the client, indicating that the client can join the room.

**Failure**

Server will emit a `error-room-join` to the client, together with the error message `err`, indicating an error occured.

### room-leave

```
socket.emit('room-leave', (data) => {....})
```

### Description

Event listener that will respond when client decides to leave a room, this listener requires the
`roomCode`, in addition to the query parameters.

### Required Payload

`roomCode` - room id of the client attempting to leave.

### Response

**Success**
Server will emit a `room-leave` to the client together with the `gameState` back to the client, indicating that the client can join the room.

Server will also emit a `user-leave` event to announce to the all clients in the room which user had left.

If the previous host left, the server will emit a `new-host` event to announce who is the new host.

**Failure**
Server will emit a `error-room-leave` to the client, together with the error message `err`, indicating an error occured.

## Game

## Misc

<!--
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
