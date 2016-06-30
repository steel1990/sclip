const debug = require('debug')('sclip-action');
const exec = require('child_process').exec;

const store = require('./store');

var actionList = store.getLocalConfigByKey('actions', {});
if (!actionList.sleep) {
    actionList.sleep = 'pmset sleepnow';
}
debug('actionList', actionList);

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

function addAction(name, cmd) {
    if (actionList[name]) {
        console.log(`Already has a command named ${name}`, actionList[name]);
        console.log(`If your want to delete it, please run "sclip action rm ${name}"!`);
        return;
    }
    actionList[name] = cmd;
    store.setLocalConfigForKey('actions', actionList);
    console.log(`${name} action was added`);
}

function deleteAction(name) {
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
    console.log('Actions:')
    for (var i in actionList) {
        console.log(`${i}: "${actionList[i]}"`);
    }
}

exports.initCommander = function (program) {
    program.command('action <name>')
        .option('-n, --name [value]', 'action name to add or remove')
        .option('-c, --cmd [value]', 'action run shell')
        .action((name, options) => {
            switch(name) {
                case "add": addAction(options.name, options.cmd); break;
                case "rm": deleteAction(options.name); break;
                case "list": getActionList(); break;
            }
        })
}