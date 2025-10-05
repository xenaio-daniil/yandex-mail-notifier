import {setDefaultEvents} from "./background/default_events.js"
import {healthCheck, initialize} from "./background/actions.js";
import events from "./background/events.js";
import {addListeners} from "./background/actions.js";


setDefaultEvents()

chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === 'yandexMailCheck') {
        healthCheck()
    }
});

chrome.action.onClicked.addListener(async (tab) => {
    chrome.tabs.create({'url':"https://mail.yandex.ru"});
});

chrome.runtime.onInstalled.addListener(async () => {
    initialize();
});

chrome.runtime.onStartup.addListener(async () => {
    initialize();
})

chrome.cookies.onChanged.addListener((cookieInfo)=>{
    if(("explicit" === cookieInfo.cause || "expired_overwrite" === cookieInfo.cause) && cookieInfo.cookie.name === 'sessguard'){
        events.accountChanged.trigger();
    }
});

addListeners();
