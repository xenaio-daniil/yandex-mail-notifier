export default {
    async sendMessage(args){
        await setupOffscreenDocument("offscreen/offscreen.html");
        args.target = 'offscreen';
        return chrome.runtime.sendMessage(args);
    }
}

let creating;
async function setupOffscreenDocument(path) {
    const offscreenUrl = chrome.runtime.getURL(path);
    const existingContexts = await chrome.runtime.getContexts({
        contextTypes: ['OFFSCREEN_DOCUMENT'],
        documentUrls: [offscreenUrl]
    });

    if (existingContexts.length > 0) {
        return;
    }

    if (creating) {
        await creating;
    } else {
        creating = chrome.offscreen.createDocument({
            url: path,
            reasons: ['CLIPBOARD', 'DOM_SCRAPING'],
            justification: 'reason for needing the document',
        });
        await creating;
        creating = null;
    }
}