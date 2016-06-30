const debug = require('debug')('sclip-action');
const exec = require('child_process').exec;

var actionList = {
    sleep: 'pmset sleepnow'
};

var run = function (cmd) {
    exec(cmd, (error, stdout, stderr) => {
        if (error) {
            debug('exec error', error);
            return;
        }
        debug('stdout', stdout);
        debug('stderr', stderr);
    });
};

exports.check = function (data) {
    if (actionList[data]) {
        run(actionList[data]);
    }
}