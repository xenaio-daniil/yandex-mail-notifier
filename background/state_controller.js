import visual from "./visual.js";

export const STATE_OFFLINE = 1 << 0;
export const STATE_UNAUTHORIZED = 1 << 1;
export const STATE_CONNECTED = 1 << 2;

class State{

    __state

    constructor() {
    }

    setState(state){
        if([
            STATE_OFFLINE,
            STATE_CONNECTED,
            STATE_UNAUTHORIZED
        ].indexOf(state) !== -1){
            this.__state = state
        }
    }

    getState(){
        return this.__state;
    }

    setUnauthorized() {
        this.setState(STATE_UNAUTHORIZED);
        visual.setUnauthorized();
    }

    setOffline() {
        this.setState(STATE_OFFLINE);
        visual.setNoInternet()
    }

    getHumanMessage(state){
        const messages = {};
        messages[STATE_OFFLINE] = "Не удалось соединиться с интернетом"
        messages[STATE_UNAUTHORIZED] = "Вы не авторизованы"
        return messages[state];
    }
}

export default new State();