const debug = require('debug')('sclip-action');
const exec = require('child_process').exec;

const systemMonitor = require('./systemMonitor');
const Service = require('./service');
const store = require('./store');

var actionList = store.getLocalConfigByKey('actions', {});
if (!actionList.sleep) {
    actionList.sleep = 'pmset sleepnow';
}
debug('actionList', actionList);

function defaultAction(data) {
    var map = {
        say: function (msg) {
            run(`say "${msg}"`);
        },
        shell: function (cmd) {
            run(cmd);
        },
        check: function () {
            exec('whoami', (err, stdout) => {
                var cfg = store.getLocalConfig();
                Service.send(
                    cfg.wilddogDomain,
                    cfg.wilddogPath,
                    cfg.pwd,
                    String(String(stdout).replace(/[\n\r]/g, '') + ':' + Date.now())
                );
            });
        },
        startMonitor: function () {
            debug('startMonitor');
            systemMonitor.start((evt) => {
                debug('monitor detected', `${evt.app}, ${evt.title}`);
                run('osascript -e "set volume 10" && say "what are you 弄啥嘞" && osascript -e "set volume 2" && pmset sleepnow');
            });
        },
        stopMonitor: function () {
            debug('stopMonitor');
            systemMonitor.stop();
        }
    };

    data = data.split(':');
    if (map[data[0]]) {
        map[data[0]](data.slice(1).join(':'));
        return true;
    }
}

function run(cmd) {
    debug('run cmd', cmd);
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
    debug('check', data);
    if (actionList[data]) {
        run(actionList[data]);
        return true;
    } else {
        return defaultAction(data);
    }
    return false;
}

function addAction(name, cmd) {
    debug('addAction', name, cmd);
    if (actionList[name]) {
        console.log(`Already has a command named ${name}`, actionList[name]);
        console.log(`If your want to delete it, please run "sclip action rm ${name}"!`);
        return;
    }
    actionList[name] = cmd;
    store.setLocalConfigForKey('actions', actionList);
    console.log(`${name} action was added`);
}

function setAction(name, cmd) {
    debug('setAction', name, cmd);
    actionList[name] = cmd;
    store.setLocalConfigForKey('actions', actionList);
    console.log(`${name} action was seted`);
}

function deleteAction(name) {
    debug('deleteAction', name);
    if (!actionList[name]) {
        console.log(`Has no action named ${name}!`);
        return;
    }
    console.log(`Action ${name}:${actionList[name]} has deleted!`);
    delete actionList[name];
    store.setLocalConfigForKey('actions', actionList);
    console.log(`${name} action was deleted`);
}

function getActionList() {
    debug('getActionList', actionList);
    console.log('Actions:')
    for (var i in actionList) {
        console.log(`${i}: "${actionList[i]}"`);
    }
}

var actionMap = {
    add: addAction,
    set: setAction,
    rm: deleteAction,
    list: getActionList,
    ls: getActionList
};

exports.initCommander = function (program) {
    debug('initCommander');
    program.command('action <name>')
        .option('-n, --name [value]', 'action name to add or remove')
        .option('-c, --cmd [value]', 'action run shell')
        .action((name, options) => {
            debug('action run', name, options.name, options.cmd);
            actionMap[name] && actionMap[name](options.name, options.cmd);
        })
}