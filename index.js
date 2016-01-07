#!/usr/bin/env node

var http = require('https');
var url = require('url');
var ncp = require('copy-paste');

var isCopy = process.argv.length === 2;

var option = url.parse('https://crackling-heat-389.firebaseio.com/clipboard.json');
option.method = isCopy ? 'GET' : 'PUT'; 

var req = http.request(option, (res) => {
    res.on('data', (data) => {
        data = JSON.parse(data);
        ncp.copy(data, () => console.log('copy ' + data + ' suc'));
    });
    res.on('end', () => console.log('suc'));
    res.on('error', (err) => console.log('error', err));
});

var data = process.argv[process.argv.length - 1];
if (isCopy) {
    req.write(`"${data}"`);
}
req.end();
