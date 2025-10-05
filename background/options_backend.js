import * as Actions from "./actions.js";

class Settings{
    static defaultSettings = {
        "notifications": true,
        "playSound": true,
        // "mailtoHook": true,
        "allAccountsCounter": true,
        "openPortal": false
    };
    __settings;

    constructor() {
        listenToOption()
        this.__settings = null;
    }

    async initSettings() {
        const settings = Object.assign({}, Settings.defaultSettings, (await chrome.storage.local.get("settings")).settings);
        chrome.storage.local.set({"settings": settings})
        this.__settings = settings;
        this.applyNewSettings()
    }

    async update(setting, value){
        if(!(setting in this.__settings)) return;
        this.__settings[setting] = value;

        chrome.storage.local.set({"settings": this.__settings})
        this.applyNewSettings(setting)
    }

    async getSettings(setting){
        if(!this.__settings || Object.values(this.__settings).length === 0 || (setting && !(setting in this.__settings))) {
            this.__settings = Object.assign({}, Settings.defaultSettings, await chrome.storage.local.get("settings").settings, this.__settings);
            chrome.storage.local.set({settings: this.__settings});
        }
        if(setting){
            return this.__settings[setting];
        }
        else{
            return this.__settings
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
            default:
                break;
        }
    })
}