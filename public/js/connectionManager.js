const Arena = require('../../common/arena');
const Events = require('../../common/events');

module.exports = class ConnectionManager {
    constructor() {
        this.storedId = localStorage.getItem("id");
        this.storedName = localStorage.getItem("name");
        this.conn = null;
        this.events = new Events();
        this.arena = new Arena();
        this.id = "";
        this.isAlive = true;
    }

    connect(address) {
        this.conn = new WebSocket(address);
        this.conn.binaryType = "arraybuffer";

        this.conn.addEventListener('open', () => {
            this.isAlive = true;
            console.log('Connection established');
            this.initializeConnection();
        });

        this.conn.addEventListener('message', event => {
            this.receive(event.data);
        });
        this.conn.addEventListener('close', function clear() {
            console.log("Closed connection :(");
        });
    }

    initSession() {
        const sessionId = window.location.hash.split('#')[1];
        console.log("sess id" + sessionId);
        if (sessionId) {
            this.joinSession(sessionId);
        } else {
            this.send([{
                type: 'create-session',
                value: []
            }]);
        }
    }

    joinSession(sessionId) {
        this.send([{
            type: 'join-session',
            value: [sessionId]
        }]);
    }

    getArenaInformation() {
        this.send([{
            type: 'need-arena-info',
            value: []
        }]);
    }

    send(data) {
        let finalMSG = "";
        for (let i = 0; i < data.length; i++) {
            finalMSG = finalMSG === "" ? data[i].type : finalMSG + " " + data[i].type;
            for (let j = 0; j < data[i].value.length; j++) {
                finalMSG = data[i].value[j] == null ? finalMSG : finalMSG + " " + data[i].value[j];
            }
        }
        let byteId = new TextEncoder().encode(finalMSG);
        console.log(`Sending message ${finalMSG} in byteArray ` + byteId);
        this.conn.send(byteId, function ack(err) {
            if (err) {
                console.error('Message failed', byteId, err);
            }
        });
    }

    receive(data) {
        let str = this.decodeMsg(data);
        console.log("message received", str);
        let messages = str.split(" ");
        for (let i = 0; i < messages.length; i++) {
            const message = messages[i++];
            if(message === "game-started"){
                this.arena.gameStarted = messages[i++] === "true";
            }
            if (message === "client-id") {
                let value = messages[i++];
                localStorage.setItem("id", value);
            }
            if (message === "new-name") {
                let value = messages[i++];
                localStorage.setItem("name", value);
                this.arena.player1.name = value;
                this.events.emit('change-name', value);
            }
            if (message === "refresh-lobby-list") {
                let arr = [];
                console.log("ARRAY", arr);
                while (messages[i] !== "END") {
                    arr.push(messages[i++]);
                }
                console.log("ARRAY", arr);
                this.events.emit('refresh-lobby-list', arr);
            }
            if (message === "session-join-result") {
                let response = messages[i++];
                this.events.emit('join-session-response', response);
            }
            if (message === "maze-data") {
                let y = 0;
                let x = 0;
                while (messages[i] !== "END") {
                    this.arena.maze[y][x].topWall = messages[i++] === "1";
                    this.arena.maze[y][x].bottomWall = messages[i++] === "1";
                    this.arena.maze[y][x].leftWall = messages[i++] === "1";
                    this.arena.maze[y][x].rightWall = messages[i++] === "1";
                    x++;
                    if (x % 15 === 0) {
                        y++;
                        x = 0;
                        console.log(y, x)
                    }
                }
                this.arena.loaded = true;
            }
            if (message === "player-ids") {
                let myGameId = messages[i++];
                let enemyGameId = messages[i++];
                this.arena.newPlayerGameIds(myGameId, enemyGameId);
            }
            if (message === "player-name") {
                this.arena.playerNewName(messages[i++], messages[i++]);
            }
            if (message === "changed-ready-status") {
                let playerId = messages[i++];
                let readyStatus = messages[i++] === "true";
                this.arena.changePlayerStatus(playerId, readyStatus);
            }
            if (message === "readyTime") {
                this.arena.readyTime = Number(messages[i++]);
            }
            if(message === "gameTime"){
                this.arena.gameTime = Number(messages[i++]);
                if(this.arena.gameTime > 0){
                    this.arena.gameStarted = true;
                    this.arena.player1.ready = true;
                    this.arena.player2.ready = true;
                }
            }
            if (message === "gameId-playerPos") {
                let gameId = messages[i++];
                let column = messages[i++];
                let row = messages[i++];
                this.arena.setPlayerPosition(gameId, column, row);
            }
            if (message === "maze-start-exit") {
                let startingX = messages[i++];
                let startingY = messages[i++];
                let endingX = messages[i++];
                let endingY = messages[i++];
                this.arena.setStart(startingX, startingY);
                this.arena.setExit(endingX, endingY);
            }
            if (message === "player-finished") {
                let gameId = messages[i++];
                let mazeTimer = messages[i++];
                this.arena.setPlayerFinalMazeTimer(gameId, mazeTimer);
            }
            if (message === "game-finished") {
                const winner = messages[i++];
                console.log("msg winner " + winner);
                this.arena.setWinner(winner);
            }
            if (message === "pong") {
                this.isAlive = true;
            }
            if (message === "ping") {
                this.isAlive = true;
                this.send([{
                    type: 'pong',
                    value: [],
                }]);
            }
            if (message === "player-connection-status") {
                let playerId = messages[i++];
                let connected = messages[i++] === "true";
                this.arena.changeConnectionStatus(playerId, connected);
            }
        }
    }

    decodeMsg(data) {
        return new TextDecoder().decode(data);
    }

    initializeConnection() {
        let message = this.storedId === null ? "noId" : this.storedId;
        console.log("my id is " + this.storedId);
        this.send([{
            type: 'welcome',
            value: [message],
        }]);
        if (this.storedName !== null) {
            this.changeName(this.storedName);
        }
    }

    getLobbyList() {
        this.send([{
            type: 'refresh-lobby-list',
            value: []
        }]);
    }

    changeName(newName) {
        this.send([{
            type: 'change-name',
            value: [newName]
        }]);
    }

    sendMoveAction(move) {
        this.send([{
            type: 'player-moved',
            value: [move]
        }]);
    }

    sendKeyPress(key) {
        this.send([{
            type: 'key-pressed',
            value: [key]
        }]);
    }

    heartbeat() {
        if (this.isAlive === false) {
            this.conn.close();
            return;
        }
        console.log("SENDING PING");
        this.isAlive = false;
        this.send([{
            type: 'ping',
            value: []
        }]);
    }
}