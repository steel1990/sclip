#!/usr/bin/env node

var ncp = require('copy-paste');
var program = require('commander');
var debug = require('debug')('sclip-index');
var notifier = require('node-notifier');

var store = require('./store');
var action = require('./action');
var Service = require('./service');

var pkg = require('./package.json');
 
program
    .version(pkg.version)
    .option('-d, --data [value]', 'data for send')
    .option('--sub-domain [value]', 'wilddog sub domain')
    .option('--path [value]', 'wilddog path(no .json)')
    .option('--pwd [value]', 'data AES encrypt password')
    .option('--no_notify')
    .option('--clear', 'clear saved password');


action.initCommander(program);

program.parse(process.argv);

var start = function (cfg) {
    debug('start', cfg);
    var service = new Service(cfg.wilddogDomain, cfg.wilddogPath, cfg.pwd);

    if (program.data) {
        debug('send data', program.data);
        service.send(program.data, () => {
            console.log('data save success');
            process.exit();
        });
    } else {
        debug('watch data');
        service.listen((data) => {
            debug(`service listen callback ${data}`);
            if (!action.check(data)) {
                ncp.copy(data, () => {
                    var msg = `copy ${data} suc`;
                    debug(msg);
                    if (!program.no_notify) {
                        notifier.notify({
                            title: pkg.name,
                            message: msg
                        });
                    }
                });
            }
        });
    }
};

if (program.rawArgs[2] !== 'action') {
    if (program.clear) {
        debug('clear');
        store.clearLocalConfigForKey('pwd');
        store.clearLocalConfigForKey('wilddogDomain');
        store.clearLocalConfigForKey('wilddogPath');
    } else if (program.pwd && program.subDomain && program.path) {
        start({
            pwd: program.pwd,
            wilddogDomain: program.subDomain,
            wilddogPath: program.path
        });
    } else {
        debug('normal');
        store.getConfig({
            pwd: {
                key: 'pwd',
                type: 'password',
                message: 'Enter your password:'
            },
            wilddogDomain: {
                key: 'wilddogDomain',
                type: 'input',
                message: 'Enter your Wilddog domain:'
            },
            wilddogPath: {
                key: 'wilddogPath',
                type: 'input',
                message: 'Enter your Wilddog path(no .json):'
            }
        }).then(cfg => {
            debug('getConfig result', cfg);
            start(cfg);
        });
    }
}