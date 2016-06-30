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

function clearLocalConfig(config) {
    setLocalConfig({});
}

function getByKey(key, type, message) {
    var config = getLocalConfig();
    if (config[key]) {
        return Promise.resolve(config[key]);
    }

    return inquirer.prompt({
        type: type,
        name: key,
        message: message
    }).then(data => {
        if (!data[key]) {
            debug(key + ' cant be empty!');
            process.exit();
        }
        setLocalConfigForKey(key, data[key]);
        return data[key];
    });
}

function getConfig(options) {
    var config = getLocalConfig();
    return Object.keys(options).filter(key => !(key in config)).reduce((seq, key) => {
        return seq.then(() => {
            return getByKey(key, options[key].type, options[key].message).then(d => config[key] = d);
        });
    }, Promise.resolve()).then(() => config, err => {
        debug('error', err);
        return config;
    });
}


module.exports = {
    getConfig: getConfig,
    getByKey: getByKey,
    clearLocalConfig: clearLocalConfig
}