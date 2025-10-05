import {UnauthorizedError} from "./errors/Unauthorized.js";
import {NoInternetError} from "./errors/NoInternet.js";
import apiConnector from "./ApiConnector.js";
import visual from "./visual.js";
import Accounts from "./accounts.js";
import WebSocketConnection from "./WebSocketConnection.js";
import {listenToPopup} from "./popup_backend.js";
import {listenToOption} from "./options_backend.js";
import Settings from "./options_backend.js"

const __UPDATE_TIMER__ = 35

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
    } catch (e) {
        if (e instanceof UnauthorizedError) {
            visual.setUnauthorized();
        }
        if (e instanceof NoInternetError) {
            visual.setNoInternet()
        }
        return;
    }
}

export function openMessage(uid, mid, fid) {
    let folder = "inbox"
    if (typeof fid != "undefined" && fid !== 1) {
        folder = "folder/" + fid
    }
    chrome.tabs.create({
        url: 'https://mail.yandex.ru/?uid=' + uid.toString() + '#' + folder + '/message/' + mid.toString()
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
        connections[uid].connection.close();
    }
}

export async function checkConnections() {
    let accounts = await Accounts.getLocalAccounts();
    breakOldConnections(accounts, connections)
    if (Object.values(accounts).length === 0) {
        visual.setUnauthorized();

    }
    else {
        for (let uid in accounts) {
            if (!(uid in connections)) {
                connections[uid] = new WebSocketConnection(uid)
            }
            if (!connections[uid].connected) {
                connections[uid].connect();
            }
        }
    }

    return true;
}

export function createAlarm() {
    chrome.alarms.clear('yandexMailCheck', () => {
        chrome.alarms.create('yandexMailCheck', {
            periodInMinutes: __UPDATE_TIMER__ / 60
        });
    });
}

export function clearAlarm(){
    chrome.alarms.clear('yandexMailCheck');
}

export async function healthCheck() {
    checkConnections().then((isAuthenticated) => {
        isAuthenticated ? fetchYandexMailCounters() : '';
        isAuthenticated ? createAlarm(): clearAlarm();
    });
}

export function addListeners() {
    listenToPopup();
    listenToOption();
}

export async function initialize() {
    await Settings.initSettings();
    healthCheck();
}