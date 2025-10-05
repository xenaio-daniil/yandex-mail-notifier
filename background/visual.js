function setUnauthorizedIcon() {
    chrome.action.setIcon({
        path: "/button/img/mail_no_login.png"
    });
    chrome.action.setBadgeText({
        text: ''
    });
}

function setNoInternetIcon(){
    chrome.action.setIcon({
        path: "/button/img/mail_no_connect.png"
    });

    chrome.action.setBadgeText({
        text: ''
    });
}

function setMailsCount(count) {
    chrome.action.setIcon({
        path: "/button/img/mail.png"
    });
    if(count > 0) {
        chrome.action.setBadgeText({
            text: count.toString()
        });
        chrome.action.setBadgeBackgroundColor({color: "#94ACDB"});
        chrome.action.setBadgeTextColor({color: "#202124"})
    }
    else{
        chrome.action.setBadgeText({
            text:''
        })
    }
}

export default {
    setUnauthorized(){
        setUnauthorizedIcon();
    },
    setNoInternet() {
        setNoInternetIcon();
    },
    setMailsCount(count){
        setMailsCount(count)
    }
}