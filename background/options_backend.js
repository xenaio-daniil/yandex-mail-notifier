import * as Actions from "./actions.js";

class Settings{
    static defaultSettings = {
        "notifications": true,
        "playSound": true,
        "allAccountsCounter": true,
        "openPortal": false
    };
    __settings;

    constructor() {
        listenToOption()
    }

    async initSettings() {
        const settings = Object.assign({}, Settings.defaultSettings, (await chrome.storage.local.get("settings")).settings);
        chrome.storage.local.set({"settings": settings})
        this.applyNewSettings()
    }

    async update(setting, value){
        const settings = Object.assign({}, Settings.defaultSettings, (await chrome.storage.local.get("settings")).settings);
        if(!(setting in settings)) return;

        chrome.storage.local.set({"settings": settings})
        this.applyNewSettings(setting)
    }

    async getSettings(setting){
        const settings = Object.assign({}, Settings.defaultSettings, (await chrome.storage.local.get("settings")).settings);
        chrome.storage.local.set({settings: this.__settings});
        if(setting){
            return settings[setting];
        }
        else{
            return settings;
        }
    }

    applyNewSettings(setting) {
        if(!setting){
            this.applyOpenPortal()
        }
        switch(setting){
            case "allAccountsCounter":
                Actions.fetchYandexMailCounters();
                break;
            case "openPortal":
                this.applyOpenPortal();
                break;
        }
    }

    async applyOpenPortal() {
        const openPortalSetting = await this.getSettings("openPortal");
        if(openPortalSetting){
            chrome.action.setPopup({popup:''})
        }
        else{
            chrome.action.setPopup({popup:'/popup/popup.html'})
        }
    }
}

const settings = new Settings();
export default settings;

export function listenToOption() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.target !== "background") return;
        switch (message.action) {
            case "updateSettings":
                settings.update(message.data.setting, message.data.value);
                break;
            case "getSettings":
                settings.getSettings().then(settings=>{
                    sendResponse(settings)
                })
                return true;
                break;
            default:
                break;
        }
    })
}