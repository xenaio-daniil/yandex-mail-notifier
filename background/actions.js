import {UnauthorizedError} from "./errors/Unauthorized.js";
import {NoInternetError} from "./errors/NoInternet.js";
import apiConnector from "./ApiConnector.js";
import visual from "./visual.js";
import Accounts from "./accounts.js";
import WebSocketConnection from "./WebSocketConnection.js";
import Settings from "./options_backend.js";
import * as StateController from "./state_controller.js";
import State from "./state_controller.js";
import version from "./versionController.js";

export function openLoginPage() {
    chrome.tabs.create({"url":"https://passport.yandex.ru/auth?retpath=https%3A%2F%2Fmail.yandex.ru"});
}


export async function getTotalCount() {
    const countersData = await apiConnector.fetchCounters();
    if (!countersData) {
        return;
    }
    let totalMessages = 0;
    for (let account of countersData) {
        totalMessages += account.data.counters.unread;
    }
    return totalMessages;
}

export async function getCurrentCount() {
    if(Accounts.currentAccount === null) {
        await Accounts.loadAccounts();
    }
    const countersData = await apiConnector.fetchCounters();
    if (!countersData) {
        return;
    }
    const currentCounter = countersData.find((counter) => counter.uid.toString() === Accounts.currentAccount.toString());
    if(!currentCounter){
        return;
    }
    return currentCounter.data.counters.unread;
}

export async function fetchYandexMailCounters() {
    try {
        let allAccountsCounter = await Settings.getSettings("allAccountsCounter");
        let totalMessages;
        if(allAccountsCounter) {
            totalMessages = await getTotalCount();
        }
        else{
            totalMessages = await getCurrentCount();
        }

        visual.setMailsCount(totalMessages);
        State.setState(StateController.STATE_CONNECTED);
    } catch (e) {
        if (e instanceof UnauthorizedError) {
            State.setUnauthorized();
        }
        if (e instanceof NoInternetError) {
            State.setOffline()
        }
    }
}

export function openMessage(uid, mid) {
    chrome.tabs.create({
        url: 'https://mail.yandex.ru/message?uid=' + uid.toString() + '&ids=' + mid.toString()
    }, () => {
    });
}

export async function markReaded(uid, mid){
    let cKey = await Accounts.getCKey()
    const result = await apiConnector.messageMarkReaded(mid, cKey);
    return result.search("<status reason=\"ok\"/>") !== -1
}

export async function markSpam(uid, mid){
    let cKey = await Accounts.getCKey()
    const result = await apiConnector.messageMarkSpam(mid, cKey);
    return result.search("<status reason=\"ok\"/>") !== -1
}

export async function deleteMessage(uid, mid){
    let cKey = await Accounts.getCKey()
    const result = await apiConnector.messageDelete(mid, cKey);
    return result.search("<status reason=\"ok\"/>") !== -1
}

const connections = {};

function breakOldConnections(accounts, connections) {
    const oldUIDs = Object.keys(connections).filter(uid=>!Object.keys(accounts).includes(uid))
    for(let uid of oldUIDs){
        const connection = connections[uid].connection;
        if(connection){
            connection.close();
        }
    }
}

export async function checkConnections() {
    let accounts = await Accounts.getLocalAccounts();
    breakOldConnections(accounts, connections)
    if (Object.values(accounts).length === 0) {
        State.setUnauthorized()
    }
    else {
        if(State.getState() === StateController.STATE_CONNECTED) {
            for (let uid in accounts) {
                if (!(uid in connections)) {
                    connections[uid] = new WebSocketConnection(uid)
                }
                if (!connections[uid].connected) {
                    connections[uid].connect();
                }
            }
        }
    }

    return true;
}

export async function healthCheck() {
    fetchYandexMailCounters().then(()=>checkConnections())
    version.checkUpdate()
}

export async function initialize() {
    await Settings.initSettings();
    State.setState(StateController.STATE_OFFLINE);
}