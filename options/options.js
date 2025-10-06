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
    console.log(feature, value);
    switch (feature) {
        case "mailtoHook":
            if(value === "on"){
                navigator.registerProtocolHandler('mailto', 'https://mail.yandex.ru/#compose?mailto=%s');
            }
            else{
                navigator.unregisterProtocolHandler('mailto', 'https://mail.yandex.ru/#compose?mailto=%s')
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
})

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
    chrome.runtime.sendMessage({
        "action":"updateSettings",
        "target": "background",
        "data":{
            setting: setting,
            value: value
        }
    })
})


loadSettings()