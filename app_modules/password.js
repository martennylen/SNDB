var crypto = require('crypto'),
    uuid = require('node-uuid');

var hash = function (passwd, salt) {
    return crypto.createHash('md5', salt).update(passwd).digest('hex');
};

function createHash(password) {
    var salt = uuid.v4();
    var pwHash = hash(password, salt);
    return { salt: salt, hash: pwHash };
}

function validateHash(pwHash, password, salt) {
    return pwHash === hash(password, salt);
}

module.exports = {
    'hash': createHash,
    'validate': validateHash
};