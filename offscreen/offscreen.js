const audio = new Audio();
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.target !== 'offscreen') return;

    if (message.type === 'PLAY_SOUND') {
        audio.src = message.sound;
        audio.play();
    }

    if (message.type === 'PARSE_XML'){
        const dom = (new DOMParser()).parseFromString(message.data.xml, 'text/xml')
        const result = {}
        for(let selector of message.data.selectors){
            const elements = dom.querySelectorAll(selector);
            const data = {
                "attributes":{},
                "content":null
            };
            const currentElements = [];
            if(elements.length>0){
                for(let elem of elements){
                    data.content = elem.textContent
                    for(let attribute in elem.attributes){
                        if(elem.attributes.hasOwnProperty(attribute)) {
                            data.attributes[attribute] = elem.attributes[attribute];
                        }
                    }
                    currentElements.push(data);
                }

            }
            result[selector] = currentElements;
        }


        sendResponse({
            result: result
        })
    }
});