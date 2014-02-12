function Editor() {
    function init() {
        this.Inputs = new InputManager();
        this.mainLoop();
    }

    function mainLoop() {
        var now = Date.now();
        var dt = (now - this.lastTime) / 1000.0;

        this.Inputs.processKeyboard();
        // update entities, animations, and such, with dt
        this.update(dt);
        render();

        this.lastTime = now;
        requestAnimFrame(this.mainLoop);
    }

    this.stateMap = {
        "CELL_PLACEMENT": {
            update: updateNothing,
            mouse: handleCameraMouse,
            keyboard: handleCameraKeyboard
        }
    }

    this.currentState = "CELL_PLACEMENT";
    this.lastTime = 0;
    this.init = init;
    this.mainLoop = mainLoop.bind(this);
}

function updateNothing(dt) {
    // the editor doesn't animate right now, or need any notion of time,
    // so this function is a nop
}