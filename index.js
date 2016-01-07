#!/usr/bin/env node

var http = require('https');
var url = require('url');
var ncp = require('copy-paste');
var CryptoJS = require("./aes");
var program = require('commander');

var pkg = require('./package.json');
 
program
  .version(pkg.version)
  .option('-p, --pwd [value]', 'password')
  .option('-d, --data [value]', 'data for send')
  .parse(process.argv);

if (!program.pwd) {
    program.help();
    process.exit();
}

var option = url.parse('https://crackling-heat-389.firebaseio.com/clipboard.json');
option.method = program.data ? 'PUT' : 'GET';

var req = http.request(option, (res) => {
    res.on('data', (data) => {
        data = JSON.parse(data);
        data = CryptoJS.AES.decrypt(data, program.pwd).toString(CryptoJS.enc.Utf8);
        ncp.copy(data, () => console.log('copy ' + data + ' suc'));
    });
    res.on('end', () => console.log('suc'));
    res.on('error', (err) => console.log('error', err));
});

if (program.data) {
    var data = CryptoJS.AES.encrypt(program.data, program.pwd).toString();
    req.write(`"${data}"`);
}
req.end();
