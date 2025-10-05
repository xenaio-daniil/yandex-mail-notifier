import {healthCheck, openMessage, initialize} from "./actions.js";

import {listenToPopup} from "./popup_backend.js";
import {listenToOption} from "./options_backend.js";
import events from "./events.js";

const __UPDATE_TIMER__ = 35

function notificationClicked(notificationId){
    const dataSplit = notificationId.split("|");
    const notificationType = dataSplit[0];
    switch(notificationType) {
        case 'new_message':
            const mid = dataSplit[1];
            const uid = dataSplit[2];
            openMessage(uid, mid);
            break;
    }
}

function cookieChanged(cookieInfo) {
    if (("explicit" === cookieInfo.cause || "expired_overwrite" === cookieInfo.cause) && cookieInfo.cookie.name === 'sessguard') {
        events.accountChanged.trigger();
    }
}

export function addSystemListeners() {
    chrome.notifications.onButtonClicked.addListener(notificationClicked)
    chrome.notifications.onClicked.addListener(notificationClicked)

    chrome.runtime.onInstalled.addListener(initialize);
    chrome.runtime.onStartup.addListener(initialize);

    chrome.alarms.onAlarm.addListener(async (alarm) => {
        if (alarm.name === 'yandexMailCheck') {
            healthCheck()
        }
    });

    chrome.action.onClicked.addListener(async (tab) => {
        chrome.tabs.create({'url':"https://mail.yandex.ru"});
    });

    chrome.cookies.onChanged.addListener(cookieChanged);

    chrome.alarms.clear('yandexMailCheck', () => {
        chrome.alarms.create('yandexMailCheck', {
            periodInMinutes: __UPDATE_TIMER__ / 60
        });
    });
}

export function addMessageListeners(){
    listenToPopup();
    listenToOption();
}