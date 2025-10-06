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