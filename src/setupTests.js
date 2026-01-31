import '@testing-library/jest-dom';

// JSDOM usually handles localStorage, but sometimes we need to be explicit if it's missing
if (!global.localStorage) {
    global.localStorage = {
        getItem: () => null,
        setItem: () => { },
        removeItem: () => { },
        clear: () => { },
        length: 0,
        key: () => null,
    };
}
