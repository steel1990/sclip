#!/usr/bin/env node

var http = require('https');
var url = require('url');

var option = url.parse('https://crackling-heat-389.firebaseio.com/clipboard.json');
option.method = 'PUT';

var req = http.request(option, (res) => {
    res.on('data', (data) => console.log(String(data)));
    res.on('end', () => console.log('suc'));
    res.on('error', (err) => console.log('error', err));
});

var data = process.argv[process.argv.length - 1];
req.write(`"${data}"`);
req.end();