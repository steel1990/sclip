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
    var ref = new Wilddog(cfg.wilddogUrl);

    if (program.data) {
        var data = CryptoJS.AES.encrypt(program.data, cfg.pwd).toString();
        ref.set(`"${data}"`, () => {
            console.log('data save success');
            process.exit();
        });
    } else {
        ref.on('value', (data, err) => {
            if (!err) {
                data = data.val();
                if (data[0] === '"') {
                    data = JSON.parse(data);
                }
                data = CryptoJS.AES.decrypt(data, cfg.pwd).toString(CryptoJS.enc.Utf8);
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
                action.check(data);
            } else {
                debug('error', err);
            }
        });
    }
};

if (program.rawArgs[2] !== 'action') {
    if (program.clear) {
        store.setLocalConfigForKey('pwd', '');
        store.setLocalConfigForKey('wilddogUrl', '');
    } else {
        store.getConfig({
            pwd: {
                key: 'pwd',
                type: 'password',
                message: 'Enter your password:'
            },
            wilddogUrl: {
                key: 'wilddogUrl',
                type: 'input',
                message: 'Enter your Wilddog url:'
            }
        }).then(cfg => {
            start(cfg);
        });
    }
}