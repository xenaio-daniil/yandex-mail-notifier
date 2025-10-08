import events from "./events.js";
import notifications from "./notifications.js";
import accounts from "./accounts.js";
import * as actions from "./actions.js";
import popup from "./popup_backend.js";
import Settings from "./options_backend.js"

async function newMessageResolved(message) {
    console.log("📨 Обнаружено новое сообщение");
    let settings = await Settings.getSettings();

    if (settings.playSound) notifications.playNotificationSound();
    if (settings.notifications) {
        notifications.showNotification("new_message|" + message.mid.toString() + "|" + message.uid.toString(), message.hdr_subject, message.hdr_from, {
            contextMessage: message.firstline,
            buttons: [
                {
                    title: 'Открыть'
                }
            ]
        });
    }
}

async function messageReaded(message) {
    console.log("✉️Сообщение прочитано")
    for (let mid of message.mids) {
        notifications.deleteNotification("new_message|" + mid.toString() + "|" + message.uid.toString())
    }
    popup.readMessage(message.uid, message.mids);
}

async function messageUnread(message) {
    console.log("📧 Сообщение восстановлено")
    popup.unreadMessage(message.uid, message.mids)
}

async function accountChanged() {
    console.log("👤 Сменился аккаунт");
    accounts.dropCKey()
    await accounts.loadAccounts();
    actions.healthCheck();
    popup.accountChanged();
}

async function newVersion(newVersionInfo) {
    Settings.getSettings("updateNotify").then(value => {
        if (value) notifications.showNotification('new_version', "Яндекс почта " + newVersionInfo.tag_name, "Доступна новая версия расширения", {
            buttons: [
                {
                    title: 'Скачать'
                }
            ]
        })
        else {
            notifications.deleteNotification("new_version");
        }
    })
    Settings.getSettings("updateInPopup").then(value => {
        if (value) {
            chrome.runtime.sendMessage({
                action: "newVersion",
                target: 'popup',
                data: newVersionInfo
            }).catch(()=>{})
        }
    })
    chrome.runtime.sendMessage({
        action: "newVersion",
        target: 'options',
        data: newVersionInfo
    }).catch(()=>{})
}

function noNewVersion() {
    notifications.deleteNotification('new_version')
    chrome.runtime.sendMessage({
        action: "newVersion",
        target: 'options',
        data: null
    }).catch(()=>{})
    chrome.runtime.sendMessage({
        action: "newVersion",
        target: 'popup',
        data: null
    }).catch(()=>{})
}

export function setDefaultEvents() {
    events.newMessage.addListener(newMessageResolved);
    events.readMessage.addListener(messageReaded)
    events.unreadMessage.addListener(messageUnread)
    events.accountChanged.addListener(accountChanged)
    events.newVersion.addListener(newVersion);
    events.noNewVersion.addListener(noNewVersion);
}