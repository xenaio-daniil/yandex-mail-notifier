class EventManager {
    constructor() {
        this._events = new Map();
        return new Proxy(this, {
            get: (target, property) => {
                if (property.startsWith('_') || property in target) {
                    return target[property];
                }

                if (!target._events.has(property)) {
                    const listeners = new Set();
                    const eventObject = {
                        addListener: (listener) => {
                            if (typeof listener !== 'function') {
                                throw new Error('Listener must be a function');
                            }
                            listeners.add(listener);
                        },
                        removeListener: (listener) => {
                            listeners.delete(listener);
                        },
                        trigger: (data) => {
                            listeners.forEach(listener => {
                                try {
                                    listener(data);
                                } catch (error) {
                                    console.error(`Error in event listener for "${property}":`, error);
                                }
                            });
                        },
                        clear: () => {
                            listeners.clear();
                        },
                        getListenerCount: () => listeners.size
                    };
                    target._events.set(property, { listeners, eventObject });
                }

                return target._events.get(property).eventObject;
            }
        });
    }
}

const event = new EventManager();
export default event;