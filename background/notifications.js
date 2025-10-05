import offscreenManager from "./offscreenManager.js";

export default {
    playNotificationSound: function(sound){
        sound = "/audio/message.mp3";
        offscreenManager.sendMessage({
            type: 'PLAY_SOUND',
            sound: sound
        })
    },
    showNotification: function(id, title, message, options){
        id = id ?? 'yandexMailNotification';
        const defaultNotificationOptions = {
            type: 'basic',
            title: title,
            message: message,
            iconUrl: "button/img/mail.png",
            silent: false
        }
        options = Object.assign({}, defaultNotificationOptions, options)
        chrome.notifications.create(
            id,
            options,
        )
    },
    deleteNotification: function(id){
        chrome.notifications.clear(id);
    }
}