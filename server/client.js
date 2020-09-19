const Events = require('events');
module.exports = class Client {

    constructor(conn, id) {
        this.conn = conn;
        this.conn.binaryType = "arraybuffer";
        this.session = null;
        this.id = id;
        this.events = new Events();
        this.name = "";
        this.pingTime = 0;
        this.timeOfLastMessage = 0;
        this.pingsUnanswered = 0;
    }

    send(data) {
        let finalMSG = "";
        for (let i = 0; i < data.length; i++) {
            finalMSG = finalMSG === "" ? data[i].type : finalMSG + " " + data[i].type;
            for (let j = 0; j < data[i].value.length; j++) {
                finalMSG = data[i].value[j] === undefined ? finalMSG : finalMSG + " " + data[i].value[j];
            }
        }
        let byteId = new TextEncoder().encode(finalMSG);
        console.log(`Sending message ${finalMSG} in byteArray ` + byteId);
        try {
            this.conn.send(byteId);
        } catch (err) {
            console.error('Message failed lost connection!', this.conn.id);
        }
    }
}