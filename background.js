import {setDefaultEvents} from "./background/default_events.js";
import {addSystemListeners, addMessageListeners} from "./background/system_listeners.js";
import {healthCheck} from "./background/actions.js";
import settings from "./background/options_backend.js";

addSystemListeners()
addMessageListeners()
setDefaultEvents()

settings.applyNewSettings();

healthCheck()