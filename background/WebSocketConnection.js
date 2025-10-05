import accounts from "./accounts.js";
import {fetchYandexMailCounters} from "./actions.js";
import events from "./events.js";

const SOCKET_URI = 'wss://push.yandex.ru/v1/subscribe/?oauth_token=%token%&client=bar&uid=%uid%&service=mail&session=bar-session-%uid%'

export default class WebSocketConnection{
    constructor(uid) {
        this.uid = uid;
        this.token = null
        this.connected = false;
        this.connection = null;
    }

    async connect(){
        this.token = this.token ?? await accounts.getToken(this.uid);
        let uri = SOCKET_URI.replace('%token%',this.token.access_token).replaceAll('%uid%', this.uid)
        this.connection = new WebSocket(uri);
        this.connection.onopen = (e)=>{
            this.connected = true;
        }
        this.connection.onclose = (e) => {
            this.connected = false;
            this.connect();
        }
        this.connection.onmessage = (message) => {
            this.parseMessage(JSON.parse(message.data));
        }
    }

    parseMessage(message) {
        switch(message.operation){
            case 'ping':
                return;
            case 'unsupported':
                switch (message.message.operation){
                    case 'status change':
                        fetchYandexMailCounters()
                        if(message.message.status === "RO"){
                            const mids = JSON.parse(message.message.mids);
                            events.readMessage.trigger({
                                uid: message.message.uid,
                                mids: mids
                            })
                        }
                        else if(message.message.status === "New"){
                            const mids = JSON.parse(message.message.mids);
                            events.unreadMessage.trigger({
                                uid:message.message.uid,
                                mids: mids
                            })
                        }
                        break;
                    case "move mails":
                        fetchYandexMailCounters();
                        break;
                }
                break;
            case 'insert':
                const messageInfo = message.message;
                if(messageInfo.hdr_status.toLowerCase() === "new") {
                    events.newMessage.trigger(messageInfo)
                }
                break;
        }
    }
}