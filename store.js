var fse = require('fs-extra');
var path = require('path');
var inquirer = require('inquirer');
var debug = require('debug')('sclip-store');

var HOME = process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;
var CONFIG_PATH = path.join(HOME, '.sclip', 'config');

function getLocalConfig() {
    fse.ensureFileSync(CONFIG_PATH);
    var config = fse.readFileSync(CONFIG_PATH, 'utf8').trim();
    try {
        config = JSON.parse(config);
    } catch (err) {
        config = {};
    }
    return config;
}

function setLocalConfig(config) {
    fse.writeFileSync(CONFIG_PATH, JSON.stringify(config));
}

function setLocalConfigForKey(key, value) {
    var config = getLocalConfig();
    config[key] = value;
    setLocalConfig(config);
}

function getLocalConfigByKey(key, defaultValue) {
    var config = getLocalConfig();
    return config[key] || defaultValue;
}

function clearLocalConfig(config) {
    setLocalConfig({});
}

function getInput(opt) {
    var key = opt.key;
    return inquirer.prompt({
        type: opt.type,
        name: key,
        message: opt.message
    }).then(data => {
        if (!data[key] && opt.defaultValue == undefined) {
            debug(key + ' cant be empty!');
            process.exit();
        }
        return data[key] || opt.defaultValue;
    });
}

function getByKey(key, type, message) {
    var config = getLocalConfig();
    if (config[key]) {
        return Promise.resolve(config[key]);
    }

    return getInput({
        key: key,
        type: type,
        message: message,
        defaultValue: defaultValue
    }).then(value => {
        setLocalConfigForKey(key, value);
        return value;
    });
}

function getConfig(options) {
    var config = getLocalConfig();
    return Object.keys(options).filter(key => !(key in config)).reduce((seq, key) => {
        return seq.then(() => {
            return getInput(options[key]).then(value => config[key] = value);
        });
    }, Promise.resolve()).then(() => config, err => {
        debug('error', err);
        return config;
    }).then(cfg => {
        setLocalConfig(cfg);
        return cfg;
    });
}


module.exports = {
    getConfig: getConfig,
    getByKey: getByKey,
    clearLocalConfig: clearLocalConfig,
    getLocalConfigByKey: getLocalConfigByKey,
    setLocalConfigForKey: setLocalConfigForKey
}