function messageButtonClicked(action, mid, uid) {
    switch(action){
        case "mark-readed":
            action = "markRead";
            break;
        case "spam":
            action = "markSpam";
            break;
        case "delete":
            action = "delete";
            break;
        case "reply":
            action = "reply";
            break;
    }
    chrome.runtime.sendMessage({
        action: action,
        data: {
            mid: mid,
            uid: uid,
        },
        target: "background"
    }).then(result => {
        if(result){
            document.querySelector(".message-item[data-mid='"+mid+"']").remove();
        }
    })
}

function openSettings() {
    chrome.runtime.sendMessage({
        action: 'openSettings',
        target: "background"
    })
}

document.body.addEventListener('click', (e) => {
    if(e.target.closest("#enter")){
        chrome.tabs.create({"url":"https://passport.yandex.ru/auth?retpath=https%3A%2F%2Fmail.yandex.ru"});
    }
    if(e.target.closest("#compose")){
        chrome.tabs.create({"url":"https://mail.yandex.ru/?uid="+document.body.getAttribute("data-uid")+"#compose"});
    }
    if(e.target.closest("#open-mailbox")){
        chrome.tabs.create({"url":"https://mail.yandex.ru/?uid="+document.body.getAttribute("data-uid")});
    }
    if(e.target.closest("#mail-list__menu-button")){
        document.body.setAttribute("data-mode", "accounts-list");
    }
    if(e.target.closest("#refresh") || e.target.closest("#inline-refresh")){
        loadMessages();
    }
    if(e.target.closest("#settings")){
        openSettings();
    }
    if(e.target.closest("#login-new")){
        chrome.tabs.create({"url":"https://passport.yandex.ru/auth/list?login=&retpath=https%3A%2F%2Fmail.yandex.ru"});
    }
    if(e.target.closest(".select-account")){
        const uid = e.target.closest(".account-item").getAttribute("data-uid");
        if(uid === currentAccount.uid){
            loadMessages();
        }
        else {
            document.body.setAttribute("data-mode", "spinner");
            chrome.runtime.sendMessage({
                action: 'changeAccount',
                target: 'background',
                data:{
                    uid: uid
                }
            })
        }
    }
    if(e.target.closest("#logout-current, .logout-account")){
        const button = e.target.closest("#logout-current, .logout-account");
        let uid;
        if(button.id === "logout-current") {
            uid = currentAccount.uid;
        }
        else {
            uid = e.target.closest(".account-item").getAttribute("data-uid");
        }
        document.body.setAttribute("data-mode", "spinner");
        chrome.runtime.sendMessage({
            action: 'logout',
            target: 'background',
            data:{
                uid: uid
            }
        })
    }
    if(e.target.closest(".message-button__element")){
        const messageContainer = e.target.closest(".message-item");
        const mid = messageContainer.getAttribute("data-mid");
        const uid = document.body.getAttribute("data-uid");
        const action = e.target.closest(".message-button__element").getAttribute("data-action");
        messageButtonClicked(action, mid, uid);
    }
    if(e.target.closest(".message-list__item")){
        const messageContainer = e.target.closest(".message-item");
        const mid = messageContainer.getAttribute("data-mid");
        let fid = messageContainer.getAttribute("data-fid");
        chrome.runtime.sendMessage({
            action: "openMessage",
            target: "background",
            data:{
                mid: mid,
                uid: document.body.getAttribute("data-uid"),
                fid: fid
            }
        })
    }
})