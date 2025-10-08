import * as Actions from "./actions.js";
import VersionController from "./versionController.js";

class Settings{
    static defaultSettings = {
        "notifications": true,
        "playSound": true,
        "allAccountsCounter": true,
        "openPortal": false,
        "updateRegularCheck": true,
        "updateInPopup": true,
        "updateNotify": false,
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

    async update(newSettings){
        const settings = Object.assign({}, Settings.defaultSettings, (await chrome.storage.local.get("settings")).settings);
        for(let setting in newSettings) {
            if (!(setting in settings)) return false;
            settings[setting] = newSettings[setting];
        }
        await chrome.storage.local.set({"settings": settings})
        this.applyNewSettings(settings)
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

    applyNewSettings(settings) {
        if(!settings){
            this.applyOpenPortal()
        }
        for(let setting in settings) {
            switch (setting) {
                case "allAccountsCounter":
                    Actions.fetchYandexMailCounters();
                    break;
                case "openPortal":
                    this.applyOpenPortal();
                    break;
                case "updateRegularCheck":
                    this.getSettings("updateRegularCheck").then((value)=>{
                        if(value){
                            VersionController.checkUpdate();
                        }
                        else{
                            VersionController.clearCached();
                        }
                    })
                    break;
            }
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
                settings.update(message.data.settings).then(()=>sendResponse());
                return true;
                break;
            case "getSettings":
                settings.getSettings().then(settings=>{
                    sendResponse(settings)
                })
                return true;
                break;
            case "getCachedVersion":
                VersionController.cachedUpdateData().then(data=>sendResponse(data));
                return true;
                break;
            case "forceCheckUpdate":
                VersionController.checkUpdate(true);
                break;
            default:
                break;
        }
    })
}