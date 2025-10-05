const MESSAGE_TEMPLATE = `<li class="message-item">
            <article class="message-list__item">
                <p class="message-header"><span class="message-from"></span><img src="icons/message/attach-ico.png" alt="(с вложениями)" title="Есть вложения" class="message-attachments"><span class="message-date"></span></p>
                <p class="message-subject"</p>
                <p class="message-text"></p>
            </article>
            <div class="message-buttons">
                <button class="message-button__element" data-action="mark-readed"><img src="icons/message/read.png" alt="Прочитано">Прочитано</button>
                <button class="message-button__element" data-action="reply"><img src="icons/message/reply.png" alt="Ответить">Ответить</button>
                <button class="message-button__element" data-action="spam"><img src="icons/message/spam.png" alt="Спам">Спам</button>
                <button class="message-button__element" data-action="delete"><img src="icons/message/delete.png" alt="Удалить">Удалить</button>
            </div>
        </li>`

const ACCOUNT_TEMPLATE = `<tr class="account-item"><td><button class="select-account"></button></td>
        <td class="account-mailbox__unreaded"></td>
        <td class="account-buttons"><button class="logout-account">Выйти</button></td>
    </tr>`

let accounts = {};
let currentAccount = null;
let counters = {}
let messagesLoaded = false;

function convertDateFromTimezone(dateString, timezone){
    const formater = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        timeZoneName: 'longOffset'
    });
    const parts = formater.formatToParts(new Date())
    const offsetPart = parts.find(part => part.type === 'timeZoneName');
    let offset
    if (offsetPart && offsetPart.value) {
        const position = offsetPart.value.search(/[+-]/)
        if(position === -1) {
            offset = "Z";
        }
        else{
            offset = offsetPart.value.slice(position);
        }
    }
    return new Date(dateString.toString() + offset.toString());
}

function isToday(date) {
    const today = new Date();
    today.setHours(0, 0,0 ,0);
    return date>=today;
}

function isThisYear(date){
    const thisYearStart = new Date();
    thisYearStart.setMonth(0, 1);
    thisYearStart.setHours(0, 0,0 ,0);
    return date>=thisYearStart;
}

function createAccountItem(uid, defaultEmail, unreaded, is_default){
    const tmp = document.createElement("tbody");
    tmp.innerHTML = ACCOUNT_TEMPLATE;
    const account = tmp.firstChild;

    account.setAttribute("data-uid", uid);
    if(is_default){
        account.classList.add('_current');
    }
    account.querySelector(".select-account").textContent = defaultEmail;
    account.querySelector(".account-mailbox__unreaded").textContent = unreaded;

    return account;
}

function createMessageItem(mid, from, subject, text, date, hasAttachments, uid, fid){
    let tmp = document.createElement("div");
    tmp.innerHTML = MESSAGE_TEMPLATE;
    const message = tmp.firstChild;

    message.setAttribute("data-mid", mid);
    message.setAttribute("data-uid", uid);
    message.setAttribute("data-fid", fid);
    if(hasAttachments){
        message.classList.add("with-attachments");
    }
    message.querySelector(".message-from").textContent = from;
    message.querySelector(".message-subject").textContent = subject.trim().length === 0 || subject === "No subject"? "(Без темы)":subject;
    message.querySelector(".message-text").textContent = text.trim().length === 0? "(Без текста)":text;
    if(isToday(date)){
        date = date.toLocaleTimeString('default', {
            "hour": 'numeric',
            "minute": '2-digit'
        })
    }
    else {
        const dateOption = {
            day: 'numeric',
            month: 'long'
        }
        if (!isThisYear(date)) {
            dateOption.year = 'numeric'
        }
        date = date.toLocaleDateString('default', dateOption);
    }
    message.querySelector('.message-date').textContent = date;
    return message;
}

function fillAccounts() {
    const table = document.querySelector(".accounts-list");
    table.innerHTML = '';
    for(let account of Object.values(accounts)){
        table.appendChild(createAccountItem(account.uid, account.defaultEmail, counters[account.uid].unread, account.is_default));
    }
}

function fillWidget(){
    if(Object.keys(counters).length === 0) return
    if(Object.keys(accounts).length === 0) return
    if(messagesLoaded) return
    loadMessages();
    fillAccounts();
}

function loadMessages(){
    document.body.setAttribute("data-mode", "spinner")
    chrome.runtime.sendMessage({
        action: "loadMessages",
        target: "background"
    }).catch(()=>{})
}

function setCurrentUserUnreaded(value){
    document.querySelector(".current-mailbox__unreaded").textContent = value;
}

function loadHeaderInfo(){
    document.body.setAttribute("data-mode", "spinner")
    loadAccountData()
    loadCounters()
}

function loadAccountData(){
    chrome.runtime.sendMessage({
        action: "loadAccountData",
        target: "background"
    }).catch(()=>{})
}

function loadCounters(){
    chrome.runtime.sendMessage({
        action: "loadCounters",
        target: "background"
    }).catch(()=>{})
}

function updateAccountData(accountsData){
    accounts = accountsData;
    currentAccount = Object.values(accountsData).find(account => account.is_default);
    if(currentAccount) {
        document.body.setAttribute("data-uid", currentAccount.uid);
        document.querySelector(".current-mailbox__name").textContent = currentAccount.defaultEmail;
        if (currentAccount.uid in counters) {
            setCurrentUserUnreaded(counters[currentAccount.uid].unread)
        }
    }
    else{

        return;
    }
    fillWidget()
}


function updateCounters(countersData) {
    counters = {};
    let total = 0;
    for(let counter of countersData){
        total += counter.data.counters.unread;
        counters[counter.uid] = counter.data.counters;
    }
    document.querySelector(".total-mailbox__unreaded").textContent = total;
    if(currentAccount){
        setCurrentUserUnreaded(counters[currentAccount.uid].unread)
    }
    fillWidget()
}

function updateMessages(messageTextData) {
    const messagesDom = (new DOMParser()).parseFromString(messageTextData, "text/xml");
    const details = messagesDom.querySelector("mailbox_list > details");
    const timezone = details.getAttribute("tz");
    const messages = messagesDom.querySelectorAll("message");
    const messages_list = document.querySelector(".mails");
    messages_list.innerHTML = "";
    if(messages.length === 0){
        showWarning("Новых писем нет", 1);
    }
    else {
        for (let message of messages) {
            messages_list.appendChild(createMessageItem(
                message.getAttribute("mid"),
                message.querySelector("from quoted").textContent.trim(),
                message.querySelector("subject text").textContent.trim(),
                message.querySelector("firstline").textContent.trim(),
                convertDateFromTimezone(message.getAttribute("date"), timezone),
                parseInt(message.getAttribute("att_count")) > 0,
                document.body.getAttribute("data-uid"),
                message.getAttribute("fid"),
            ));
        }
        document.body.setAttribute("data-mode", "message-list")
    }
    messagesLoaded = true;
}

function accountChanged() {
    messagesLoaded = false;
    accounts = {};
    counters = {};
    loadHeaderInfo()
}

function showWarning(message, withRefresh) {
    document.body.setAttribute("data-mode","message");
    document.querySelector(".message-content").textContent = message;
    switch(withRefresh){
        case 1:
            document.querySelector(".message").setAttribute("data-mode", "inline-refresh");
            break;
        case 2:
            document.querySelector(".message").setAttribute("data-mode", "total-refresh");
            break;
        default:
            document.querySelector(".message").setAttribute("data-mode", "no-refresh");
            break;
    }
}

function createBackgroundListener() {
    chrome.runtime.onMessage.addListener(async (message, sender) =>{
        if(message.target !== "popup") return;
        switch(message.action) {
            case "initialize":
                initialize();
                break;
            case "loadAccountData":
                updateAccountData(message.data)
                break;
            case "loadCounters":
                updateCounters(message.data)
                break;
            case "loadMessages":
                updateMessages(message.data)
                break;
            case "accountChanged":
                accountChanged()
                break;
            case "markReadMessage":
                if(message.data.uid === currentAccount.uid){
                    if(message.data.mids) {
                        for (let mid of message.data.mids) {
                            const message_item = document.querySelector(".message-item[data-mid='"+mid+"']");
                            if(message_item) message_item.remove();
                        }
                    }
                    else{
                        loadMessages()
                    }
                }
                break;
            case "markNewMessage":
                if(message.data.uid === currentAccount.uid){
                    loadMessages();
                }
                break;
            case "showWarning":
                console.log(message);
                showWarning(message.data.message, message.data.showRefresh)
                break;
        }
    })
}

async function initialize(){
    createBackgroundListener()
    await loadHeaderInfo();
}

initialize();