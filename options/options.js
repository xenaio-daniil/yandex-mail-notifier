async function loadSettings(){
    const settings = await chrome.runtime.sendMessage({
        "target":'background',
        'action': "getSettings"
    });

    for(let setting in settings){
        let input = document.querySelector("[preference='"+setting+"']");
        if(!input) continue;
        if(settings[setting] === true || settings[setting] === false){
            input.checked = settings[setting]
        }
    }
}

async function getCachedVersion(){
    const newVersionInfo = await chrome.runtime.sendMessage({
        "target":'background',
        'action': "getCachedVersion"
    })
    handleNewVersionData(newVersionInfo);
}

function parseValueFromInput(input) {
    switch(input.type.toLowerCase()){
        case "checkbox":
            return input.checked;
            break;
        case "text":
            return input.value;
            break;
    }
}

async function applyFeature(feature, value) {
    switch (feature) {
        case "mailtoHook":
            navigator.unregisterProtocolHandler('mailto', 'https://mail.yandex.ru/#compose?mailto=%s')
            if(value === "on"){
                navigator.registerProtocolHandler('mailto', 'https://mail.yandex.ru/#compose?mailto=%s');
            }
            break;
    }
}

document.querySelector(".settings").addEventListener("click", (e)=>{
    if(e.target.closest(".feature-activation-button")){
        e.preventDefault();
        const button = e.target.closest(".feature-activation-button")
        applyFeature(button.getAttribute("feature"), button.getAttribute("action"))
    }
    if(e.target.closest("#checkUpdate")){
        e.preventDefault();
        chrome.runtime.sendMessage({
            "target":"background",
            "action":"forceCheckUpdate"
        })
    }
})

function applyDependentSettings(setting, value) {
    const dependentSettings = {};
    switch (setting){
        case "updateRegularCheck":
            if(!value) {
                for (let preference of ["updateNotify", "updateInPopup"]) {
                    document.querySelector("[preference="+preference+"]").checked = false;
                    dependentSettings[preference] = false;
                }
            }
            break;
        case "updateNotify":
        case "updateInPopup":
            if(value){
                document.querySelector("[preference=updateRegularCheck]").checked = true;
                dependentSettings["updateRegularCheck"] = true;
            }
            break;
    }
    return dependentSettings;
}

async function updateSetting(setting, value) {
    let settings = {};
    settings[setting] = value;
    settings = Object.assign({}, settings, await applyDependentSettings(setting, value))
    chrome.runtime.sendMessage({
        "action":"updateSettings",
        "target": "background",
        "data":{
            settings: settings
        }
    }).then(()=>loadSettings());
}

document.querySelector(".settings").addEventListener("change", (e)=>{
    let value;
    const input = e.target.closest("input, select, textarea");
    switch (input.tagName.toLowerCase()){
        case "input":
            value = parseValueFromInput(input);
            break;
        case "select":
            value = input.value;
            break;
        case "textarea":
            value = input.value
    }
    const setting = input.getAttribute("preference");
    updateSetting(setting, value)

})

function handleNewVersionData(newVersionInfo) {
    const span = document.getElementById("newVersionInfo");
    if(!newVersionInfo){
        span.classList.remove("_exists");
        span.innerHTML = "";
        return;
    }
    span.classList.add("_exists");
    let newVersionText = `Доступна новая версия ${newVersionInfo.tag_name}. 
            <a href='https://github.com/xenaio-daniil/yandex-mail-notifier/releases/latest' target="_blank">Скачать</a>`
    span.innerHTML = newVersionText;
}

chrome.runtime.onMessage.addListener((message)=>{
    if(message.target !== "options") return;
    switch(message.action){
        case "newVersion":
            handleNewVersionData(message.data)
            break;
    }
})


loadSettings()

getCachedVersion()
document.getElementById("version").innerText = chrome.runtime.getManifest().version