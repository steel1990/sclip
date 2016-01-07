#!/usr/bin/env node

var http = require('https');
var url = require('url');
var ncp = require('copy-paste');
var program = require('commander');

var CryptoJS = require("./aes");
var pwd = require('./pwd');

var pkg = require('./package.json');
 
program
    .version(pkg.version)
    .option('-d, --data [value]', 'data for send')
    .option('--clear', 'clear saved password')
    .parse(process.argv);


var action = function (password) {
    var option = url.parse('https://crackling-heat-389.firebaseio.com/clipboard.json');
    option.method = program.data ? 'PUT' : 'GET';

    var req = http.request(option, (res) => {
        res.on('data', (data) => {
            data = JSON.parse(data);
            data = CryptoJS.AES.decrypt(data, password).toString(CryptoJS.enc.Utf8);
            ncp.copy(data, () => console.log('copy ' + data + ' suc'));
        });
        res.on('end', () => console.log('suc'));
        res.on('error', (err) => console.log('error', err));
    });

    if (program.data) {
        var data = CryptoJS.AES.encrypt(program.data, password).toString();
        req.write(`"${data}"`);
    }
    req.end();
};

if (program.clear) {
    pwd.clearPassword();
} else {
    pwd.getPassword(action);
}
