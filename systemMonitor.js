var monitor = require('active-window');
var debug = require('debug')('systemMonitor');
var intervalId = 0;
var lastApp = '';
var lastAppTitle = '';


exports.start = function (onChanged) {
    if (intervalId) {
        return;
    }

    lastApp = '';
    lastAppTitle = '';

    intervalId = setInterval(() => {
        try {
            monitor.getActiveWindow(evt => {
                if ((lastApp && lastApp !== evt.app) || (lastAppTitle && lastAppTitle !== evt.title)) {
                    debug('onChanged', lastApp, lastAppTitle, evt.app, evt.title);
                    onChanged && onChanged(evt);
                }
                lastApp = evt.app;
                lastAppTitle = evt.title;
            });
        } catch (err) {
            debug('error', err);
        }
    }, 500);
}

exports.stop = function () {
    clearInterval(intervalId);
    intervalId = 0;
}

// exports.start(evt => console.log(evt.app, evt.title));