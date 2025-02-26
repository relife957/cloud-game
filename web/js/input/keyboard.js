/**
 * Keyboard controls.
 *
 * @version 1
 */
const keyboard = (() => {
    // default keyboard bindings
    const defaultMap = Object.freeze({
        ArrowLeft: KEY.LEFT,
        ArrowUp: KEY.UP,
        ArrowRight: KEY.RIGHT,
        ArrowDown: KEY.DOWN,
        KeyZ: KEY.A,
        KeyX: KEY.B,
        KeyC: KEY.X,
        KeyV: KEY.Y,
        KeyA: KEY.L,
        KeyS: KEY.R,
        Semicolon: KEY.L2,
        Quote: KEY.R2,
        Period: KEY.L3,
        Slash: KEY.R3,
        Enter: KEY.START,
        ShiftLeft: KEY.SELECT,
        // non-game
        KeyQ: KEY.QUIT,
        KeyW: KEY.JOIN,
        KeyK: KEY.SAVE,
        KeyL: KEY.LOAD,
        Digit1: KEY.PAD1,
        Digit2: KEY.PAD2,
        Digit3: KEY.PAD3,
        Digit4: KEY.PAD4,
        KeyF: KEY.FULL,
        KeyH: KEY.HELP,
        Backslash: KEY.STATS,
        Digit9: KEY.SETTINGS,
        KeyM: KEY.MULTITAP,
        KeyT: KEY.DTOGGLE
    });

    let keyMap = {};
    let isKeysFilteredMode = true;

    const remap = (map = {}) => {
        settings.set(opts.INPUT_KEYBOARD_MAP, map);
        log.info('Keyboard keys have been remapped')
    }

    event.sub(KEYBOARD_TOGGLE_FILTER_MODE, data => {
        isKeysFilteredMode = data.mode !== undefined ? data.mode : !isKeysFilteredMode;
        log.debug(`New keyboard filter mode: ${isKeysFilteredMode}`);
    });

    let dpadMode = true;
    let dpadState = {[KEY.LEFT]: false, [KEY.RIGHT]: false, [KEY.UP]: false, [KEY.DOWN]: false};

    function onDpadToggle(checked) {
        if (dpadMode === checked) {
            return //error?
        }

        dpadMode = !dpadMode
        if (dpadMode) {
            // reset dpad keys pressed before moving to analog stick mode
            for (const key in dpadState) {
                if (dpadState[key]) {
                    dpadState[key] = false;
                    event.pub(KEY_RELEASED, {key: key});
                }
            }
        } else {
            // reset analog stick axes before moving to dpad mode
            if (!!dpadState[KEY.RIGHT] - !!dpadState[KEY.LEFT] !== 0) {
                event.pub(AXIS_CHANGED, {id: 0, value: 0});
            }
            if (!!dpadState[KEY.DOWN] - !!dpadState[KEY.UP] !== 0) {
                event.pub(AXIS_CHANGED, {id: 1, value: 0});
            }
            dpadState = {[KEY.LEFT]: false, [KEY.RIGHT]: false, [KEY.UP]: false, [KEY.DOWN]: false};
        }
    }

    const onKey = (code, evt, state) => {
        const key = keyMap[code]
        if (key === undefined) return

        if (dpadState[key] !== undefined) {
            dpadState[key] = state
            if (!dpadMode) {
                const LR = key === KEY.LEFT || key === KEY.RIGHT
                event.pub(AXIS_CHANGED, {
                    id: !LR,
                    value: !!dpadState[LR ? KEY.RIGHT : KEY.DOWN] - !!dpadState[LR ? KEY.LEFT : KEY.UP]
                })
                return
            }
        }
        event.pub(evt, {key: key})
    }

    event.sub(DPAD_TOGGLE, (data) => onDpadToggle(data.checked));

    return {
        init: () => {
            keyMap = settings.loadOr(opts.INPUT_KEYBOARD_MAP, defaultMap);
            const body = document.body;
            // !to use prevent default as everyone
            body.addEventListener('keyup', e => {
                e.stopPropagation();
                if (isKeysFilteredMode) {
                    onKey(e.code, KEY_RELEASED, false)
                } else {
                    event.pub(KEYBOARD_KEY_PRESSED, {key: e.code});
                }
            }, false);

            body.addEventListener('keydown', e => {
                e.stopPropagation();
                if (isKeysFilteredMode) {
                    onKey(e.code, KEY_PRESSED, true)
                } else {
                    event.pub(KEYBOARD_KEY_PRESSED, {key: e.code});
                }
            });

            log.info('[input] keyboard has been initialized');
        }, settings: {
            remap
        }
    }
})(event, document, KEY, log, opts, settings);
