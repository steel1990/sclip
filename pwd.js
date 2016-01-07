var fse = require('fs-extra');
var path = require('path');
var inquirer = require('inquirer');


var HOME = process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;
var CONFIG_PATH = path.join(HOME, '.sclip', 'config');

var getLocalPassword = function () {
    fse.ensureFileSync(CONFIG_PATH);
    var config = fse.readFileSync(CONFIG_PATH, 'utf8').trim();
    try {
        config = JSON.parse(config);
    } catch (err) {
        config = {};
    }

    return config.pwd;
};

var savePasswordToLocal = function (pwd) {
    var config = { pwd: pwd };
    fse.writeFileSync(CONFIG_PATH, JSON.stringify(config));
};

var getPassword = function (cb) {
    var pwd = getLocalPassword();
    if (pwd) {
        cb(pwd);
        return;
    }

    inquirer.prompt({
        type: 'password',
        name: 'pwd',
        message: 'Enter your password:'
    }, (data) => {
        if (!data.pwd) {
            console.error('Password cant be empty!');
            process.exit();
        }
        savePasswordToLocal(data.pwd);
        cb(data.pwd);
    });
};

exports.getPassword = getPassword;
exports.clearPassword = function () {
    fse.writeFileSync(CONFIG_PATH, '{}');
};
