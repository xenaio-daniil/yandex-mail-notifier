import events from "./events.js";
import Settings from './options_backend.js';

class VersionController{
    current(){
        return chrome.runtime.getManifest().version;
    }

    async loadLatestRelease(){
        return fetch("https://api.github.com/repos/xenaio-daniil/yandex-mail-notifier/releases/latest").then(data=>{
            if(data.status !== 200){
                return {"tag_name":0}
            }
            return data.json()
        })
    }

    async getNewVersionInfo(force){
        force = force ?? false
        const regularCheck = await Settings.getSettings("updateRegularCheck");
        if(!(regularCheck || force)) return;
        let newVersionInfo;
        if(!await this.canCheckUpdate(force)){
            newVersionInfo = await this.cachedUpdateData();
        }
        else {
            newVersionInfo = await this.loadLatestRelease().then(versionInfo => {
                const currentVersion = chrome.runtime.getManifest().version;
                const hasNewVersion = this.compareVersions(currentVersion, versionInfo.tag_name);
                if (hasNewVersion !== 1) return;
                return versionInfo;
            })
            chrome.storage.local.set({"lastUpdateCheck": (new Date()).getTime()})
            chrome.storage.local.set({"newVersionInfo":newVersionInfo})
        }
        return newVersionInfo;
    }

    async checkUpdate(force){
        const newVersionInfo = await this.getNewVersionInfo(force);
        if(newVersionInfo){
            events.newVersion.trigger(newVersionInfo);
        }
        else{
            events.noNewVersion.trigger();
        }
        return newVersionInfo;
    }

    compareVersions(current, candidate) {
        current = current.toString()
        candidate = candidate.toString()
        current = current.replace(/^\D+/, "");
        candidate = candidate.replace(/^\D+/, "");
        const currentArr = current.split(".");
        const candidateArr = candidate.split(".");
        while(currentArr.length > 0 && candidateArr.length > 0){
            let currentIndex = parseInt(currentArr.shift());
            let candidateIndex = parseInt(candidateArr.shift());
            if(currentIndex > candidateIndex) return -1;
            if(currentIndex < candidateIndex) return 1;
        }
        if(currentArr.length > candidateArr.length) return -1;
        if(currentArr.length < candidateArr.length) return 1;

        return 0
    }

    async cachedUpdateData() {
        return (await chrome.storage.local.get(["newVersionInfo"])).newVersionInfo;
    }

    async canCheckUpdate(force) {
        const lastTime = (await chrome.storage.local.get(["lastUpdateCheck"])).lastUpdateCheck ?? null;
        const currentTime = (new Date()).getTime()
        return !lastTime || lastTime < currentTime - 60*60*1000 || (force && lastTime < currentTime - 5*60*1000);
    }

    clearCached(){
        chrome.storage.local.remove(["newVersionInfo"]);
        events.noNewVersion.trigger();
    }
}
const vc = new VersionController()
export default vc;

