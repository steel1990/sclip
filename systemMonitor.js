var monitor = require('active-window');
var intervalId = 0;
var lastApp = '';
var lastAppTitle = '';


exports.start = function (onChanged) {
    if (intervalId) {
        return;
    }

    intervalId = setInterval(() => {
        monitor.getActiveWindow(evt => {
            if ((lastApp && lastApp !== evt.app) || (lastAppTitle && lastAppTitle !== evt.title)) {
                onChanged && onChanged(evt);
            }
            lastApp = evt.app;
            lastAppTitle = evt.title;
        });
    }, 1000);
}

exports.stop = function () {
    clearInterval(intervalId);
    intervalId = 0;
}

// exports.start(evt => console.log(evt.app, evt.title));