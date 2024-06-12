"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.homeActor = exports.homeMachine = void 0;
var xstate_1 = require("xstate");
exports.homeMachine = (0, xstate_1.setup)({
    types: {}
}).createMachine({
    context: {
        temp: 67,
        color: 'FF0000'
    },
    on: {
        SETCOLOR: {
            actions: (0, xstate_1.assign)({
                color: function (_a) {
                    var event = _a.event;
                    return event.value;
                },
            }),
        },
        SETTEMP: {
            actions: (0, xstate_1.assign)({
                temp: function (_a) {
                    var event = _a.event;
                    return event.value;
                },
            }),
        },
    },
});
exports.homeActor = (0, xstate_1.createActor)(exports.homeMachine).start();
exports.homeActor.subscribe(function (state) {
    console.log("~~ home state : ".concat(state.context.temp, " degrees with a ").concat(state.context.color, " light color."));
});
