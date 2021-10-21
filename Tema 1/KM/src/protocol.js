const forge = require("node-forge");

function createKeys() {
    global.publicKey = forge.random.getBytesSync(16);
    global.privateKey = forge.random.getBytesSync(16);
    global.iv = forge.random.getBytesSync(16);
}

const encrypt = ({ data, key }) => {
    const cipher = forge.cipher.createCipher(global.mode, key);
    cipher.start({ iv: global.iv });
    cipher.update(forge.util.createBuffer(data));
    cipher.finish();
    const encrypted = cipher.output;

    return encrypted.data;
};

const decrypt = ({ data, key }) => {
    const decipher = forge.cipher.createDecipher(global.mode, key);
    decipher.start({ iv: global.iv });
    decipher.update(forge.util.createBuffer(data));
    const ok = decipher.finish();

    return decipher.output.bytes();
};

const Protocol = function() {};
Protocol.prototype.createKeys = createKeys;
Protocol.prototype.encrypt = encrypt;
Protocol.prototype.decrypt = decrypt;

module.exports = new Protocol();