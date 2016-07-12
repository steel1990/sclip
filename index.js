#!/usr/bin/env node

var http = require('https');
var url = require('url');
var ncp = require('copy-paste');
var program = require('commander');
var Wilddog = require("wilddog");
var debug = require('debug')('sclip-index');
const notifier = require('node-notifier');

var CryptoJS = require("./aes");
var store = require('./store');
var action = require('./action');

var pkg = require('./package.json');
 
program
    .version(pkg.version)
    .option('-d, --data [value]', 'data for send')
    .option('--no_notify')
    .option('--clear', 'clear saved password');


action.initCommander(program);

program.parse(process.argv);


var start = function (cfg) {
    debug('start', cfg);
    var wilddogUrl = 'https://' + cfg.wilddogDomain + '.wilddogio.com/' + cfg.wilddogPath;
    var ref = new Wilddog(wilddogUrl);

    if (program.data) {
        debug('send data', program.data);
        var data = CryptoJS.AES.encrypt(program.data, cfg.pwd).toString();
        ref.set(`"${data}"`, () => {
            console.log('data save success');
            process.exit();
        });
    } else {
        debug('watch data');
        ref.on('value', (data, err) => {
            if (!err) {
                data = data.val();
                if (data[0] === '"') {
                    data = JSON.parse(data);
                }
                data = CryptoJS.AES.decrypt(data, cfg.pwd).toString(CryptoJS.enc.Utf8);
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
            } else {
                debug('error', err);
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