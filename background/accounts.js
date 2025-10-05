import apiConnector from "./ApiConnector.js";
import offscreenManager from "./offscreenManager.js";

let cKey = null;

class Accounts{

    constructor() {
        this.currentAccount = null
    }

    setCurrentAccount(uid){
        this.currentAccount = uid;
    }
    async getLocalAccounts() {
        const data = await chrome.storage.local.get(["accounts"]);
        if (!('accounts' in data)) {
            const accounts = await this.loadAccounts();
            return accounts;
        } else {
            return data.accounts;
        }

    }
    async loadAccounts() {
        const response = await apiConnector.fetchAccounts();
        const accounts = {};
        if ('accounts' in response) {
            for (let account of response.accounts) {
                account.is_default = response.default_uid === account.uid
                if(account.is_default) {
                    this.setCurrentAccount(account.uid);
                }
                accounts[account.uid] = account;
            }
        }
        chrome.storage.local.set({"accounts": accounts})
        return accounts;
    }
    async getToken(uid) {
        let tokens = (await chrome.storage.local.get("accessTokens")).accessTokens;
        if (!tokens) {
            tokens = {};
        }
        if (!(uid in tokens)) {
            tokens[uid] = await this.loadToken(uid)
            chrome.storage.local.set({accessTokens: tokens})
        }
        if (tokens[uid].expires < Date.now() + (60 * 60 * 1000)) {
            tokens[uid] = await this.loadToken(uid)
            chrome.storage.local.set({accessTokens: tokens})
        }
        return tokens[uid];
    }
    async loadToken(uid) {
        const sessionId = await this.getSessionId(uid);
        const token = await apiConnector.getToken(uid, sessionId);
        token.expires = token.expires_in * 1000 + Date.now();
        delete token.expires_in;
        return token;
    }
    async getSessionId() {
        return await chrome.cookies.getAll({'domain': '.yandex.ru', 'name': 'Session_id'})
    }
    async changeAccount(uid) {
        const yuidss = await chrome.cookies.getAll({'name': 'yuidss'});
        if (yuidss[0]) {
            apiConnector.changeAccount(uid, yuidss[0].value);
        }
    }
    async logout(uid) {
        const yuidss = await chrome.cookies.getAll({'name': 'yuidss'});
        if (yuidss[0]) {
            apiConnector.logout(uid, yuidss[0].value);
        }
    }
    dropCKey() {
        cKey = null;
    }
    async getCKey(uid) {
        if (!cKey) {
            const account_information = await apiConnector.loadAccountInformation();
            const parsed = await offscreenManager.sendMessage({
                'type': "PARSE_XML",
                'data': {
                    "xml": account_information,
                    "selectors": ["account_information > ckey", "account_information > uid"]
                }
            })
            let result = parsed.result["account_information > ckey"];
            let current_uid = parsed.result["account_information > uid"];
            if (!result || result.length === 0) {
                return null
            }
            cKey = result[0].content;
        }
        return cKey;
    }
}

export default new Accounts()