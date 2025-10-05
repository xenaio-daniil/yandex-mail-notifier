import {UnauthorizedError} from './errors/Unauthorized.js';
import {NoInternetError} from './errors/NoInternet.js';
import accounts from "./accounts.js";

const COUNTER_URI = 'https://mail.yandex.ru/api/v2/bar/counters?silent&multi';
const ACCOUNT_LIST_URI = 'https://api.passport.yandex.ru/accounts'
const TOKEN_URI = 'https://oauth.yandex.ru/token'
const MESSAGE_LIST = 'https://mail.yandex.ru/api/mailbox_list?first=0&last=40&extra_cond=only_new&goto=all&elmt=mail'
const MESSAGE_OPERATIONS = 'https://mail.yandex.ru/api/mailbox_oper'
const CHANGE_ACCOUNT = "https://passport.yandex.ru/passport?mode=embeddedauth"
const ACCOUNT_INFO_URI = 'https://mail.yandex.ru/api/account_information'

const CLIENT_ID = "49c545918c574ac28dd7d27e8297065a"
const CLIENT_SECRET = "813caaea334a4fb5be54a8b9af3f4c97"

export default {
    async fetchCounters() {
        try {
            const response = await fetch(COUNTER_URI, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                if (response.status === 500) {
                    throw new UnauthorizedError(`HTTP error! status: ${response.status}`);
                } else {
                    throw new NoInternetError(`HTTP error! status: ${response.status}`);
                }
            }

            const data = await response.json();

            await accounts.syncByUID(data.map(item=>item.uid));

            return data;

        } catch (error) {
            if (error instanceof UnauthorizedError) {
                throw error;
            }
            if (error instanceof NoInternetError) {
                throw error;
            }
            throw new NoInternetError(`No Internet`);
        }
    },

    async fetchAccounts() {
        try {
            const response = await fetch(ACCOUNT_LIST_URI, {
                method: 'GET',
                type: 'xml',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json()

        } catch (error) {
            return null;
        }
    },

    async getToken(uid, sessionId) {
        try {
            const data = new FormData();
            data.set('client_id', CLIENT_ID);
            data.set('client_secret', CLIENT_SECRET);
            data.set('host', 'yandex.ru');
            data.set('grant_type', 'sessionid');
            data.set('sessionid', sessionId);
            data.set('uid', uid);
            const response = await fetch(TOKEN_URI, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json'
                },
                body: data
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json()

        } catch (error) {
            return null;
        }
    },
    async loadMessagesAsText() {
        try {
            const response = await fetch(MESSAGE_LIST);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.text()

        } catch (error) {
            return "";
        }
    },
    async messageMarkReaded(mid, ckey) {
        try {
            const response = await fetch(MESSAGE_OPERATIONS, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json'
                },
                body: new URLSearchParams({
                    oper: 'mark_read',
                    ids: mid,
                    ckey: ckey
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.text()

        } catch (error) {
            return null;
        }
    },
    async messageMarkSpam(mid, ckey) {
        try {
            const response = await fetch(MESSAGE_OPERATIONS, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json'
                },
                body: new URLSearchParams({
                oper: 'tospam',
                ids: mid,
                ckey: ckey
            })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.text()

        } catch (error) {
            return null;
        }
    },
    async messageDelete(mid, ckey) {
        try {
            const response = await fetch(MESSAGE_OPERATIONS, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json'
                },
                body: new URLSearchParams({
                    oper: 'delete',
                    ids: mid,
                    ckey: ckey
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.text()

        } catch (error) {
            return null;
        }
    },
    async changeAccount(uid, yu) {
        try {
            const data = new FormData();
            data.set('uid', uid);
            data.set('yu', yu);
            data.set('action', 'change_default');
            data.set('retpath', "http://api.browser.yandex.ru/elements/embeddedauth.html");

            const response = await fetch(CHANGE_ACCOUNT, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json'
                },
                credentials: 'include',
                body: new URLSearchParams({
                    uid: uid,
                    yu: yu,
                    action: 'change_default',
                    retpath: "http://api.browser.yandex.ru/elements/embeddedauth.html"
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.text()

        } catch (error) {
            return null;
        }
    },
    async logout(uid, yu) {
        try {
            const data = new FormData();
            data.set('uid', uid);
            data.set('yu', yu);
            data.set('action', 'change_default');
            data.set('retpath', "http://api.browser.yandex.ru/elements/embeddedauth.html");

            const response = await fetch(CHANGE_ACCOUNT, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json'
                },
                credentials: 'include',
                body: new URLSearchParams({
                    uid: uid,
                    yu: yu,
                    action: 'logout',
                    retpath: "http://api.browser.yandex.ru/elements/embeddedauth.html"
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.text()

        } catch (error) {
            return null;
        }
    },
    async loadAccountInformation() {
        try {
            const response = await fetch(ACCOUNT_INFO_URI, {
                method: 'GET',
                type: 'xml'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.text()

        } catch (error) {
            return null;
        }
    }
}