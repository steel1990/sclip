var debug = require('debug')('sclip-service');
var ncp = require('copy-paste');
var Wilddog = require("wilddog");
var notifier = require('node-notifier');
var CryptoJS = require("./aes");
var store = require('./store');

var serviceMap = {};

function Service (domain, path, pwd) {
    var key = `${domain}_${path}_${pwd}`;
    if (serviceMap[key]) {
        return serviceMap[key];
    } else {
        serviceMap[key] = this;
    }

    var wilddogUrl = `https://${domain}.wilddogio.com/${path}`;
    debug('new Service', domain, path, wilddogUrl);
    this.pwd = pwd;
    this.ref = new Wilddog(wilddogUrl);
}

Service.send = function (domain, path, pwd, msg, cb) {
    debug('Service.send', domain, path, msg);
    new Service(domain, path, pwd).send(msg, cb);
}

Service.prototype.send = function (msg, cb) {
    debug('send', msg);
    var data = CryptoJS.AES.encrypt(msg, this.pwd).toString();
    this.ref.set(`${data}`, () => {
        cb && cb(msg);
    });
};

Service.listen = function(domain, path, pwd, cb) {
    debug('Service.listen', domain, path);
    new Service(domain, path, pwd).listen(cb);
}

Service.prototype.listen = function (cb) {
    debug('listen');
    this.ref.on('value', (data, err) => {
        if (!err) {
            data = data.val();
            if (data[0] === '"') {
                data = JSON.parse(data);
            }
            data = CryptoJS.AES.decrypt(data, this.pwd).toString(CryptoJS.enc.Utf8);
            cb && cb(data);
        } else {
            debug('error', err);
        }
    });
};

module.exports = Service;