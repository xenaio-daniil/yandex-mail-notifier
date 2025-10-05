import events from "./events.js";
import notifications from "./notifications.js";
import {openMessage} from "./actions.js";
import accounts from "./accounts.js";
import * as actions from "./actions.js";
import Popup_backend from "./popup_backend.js";
import popup from "./popup_backend.js";
import Settings from "./options_backend.js"

chrome.notifications.onClicked.addListener((notificationId)=>{
    const dataSplit = notificationId.split("|");
    const notificationType = dataSplit[0];
    switch(notificationType) {
        case 'new_message':
            const mid = dataSplit[1];
            const uid = dataSplit[2];
            openMessage(uid, mid);
            break;
    }
})
chrome.notifications.onButtonClicked.addListener((notificationId, buttonIdx) => {
    const dataSplit = notificationId.split("|");
    const notificationType = dataSplit[0];
    switch(notificationType){
        case 'new_message':
            const mid = dataSplit[1];
            const uid = dataSplit[2];
            openMessage(uid, mid);
            break;
    }
})
export function setDefaultEvents() {
    events.newMessage.addListener(async (message)=>{
        console.log("📨 Обнаружено новое сообщение");
        let settings = await Settings.getSettings();

        if(settings.playSound) notifications.playNotificationSound();
        if(settings.notifications) {
            notifications.showNotification("new_message|"+message.mid.toString()+"|"+message.uid.toString(), message.hdr_subject, message.hdr_from, {
                contextMessage: message.firstline,
                buttons:[
                    {
                        title: 'Открыть'
                    }
                ]
            });
        }
    });

    events.readMessage.addListener(async (message)=>{
        console.log("✉️Сообщение прочитано")
        for(let mid of message.mids) {
            notifications.deleteNotification("new_message|" + mid.toString() + "|" + message.uid.toString())
        }
        popup.readMessage(message.uid, message.mids);
    })

    events.unreadMessage.addListener(async (message)=>{
        console.log("📧 Сообщение восстановлено")
        popup.unreadMessage(message.uid, message.mids)
    })

    events.accountChanged.addListener(async () => {
        console.log("👤 Сменился аккаунт");
        accounts.dropCKey()
        await accounts.loadAccounts();
        actions.healthCheck();
        popup.accountChanged();
    })
}