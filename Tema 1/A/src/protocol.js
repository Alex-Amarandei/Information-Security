const fs = require("fs");
const fetch = require("cross-fetch");
const KeyManager = "http://localhost:3030/";
const B = "http://localhost:3032/";
const AES = require("crypto-js/aes");
const CryptoJS = require("crypto-js");

const initialize = async() => {
    const response = await fetch(`${KeyManager}initial/info`);
    if (response.status !== 200) {
        console.log("Problem occured during run. Status Code: " + response.status);
        return;
    }
    const { publicKey, iv } = await response.json();
    global.publicKey = publicKey;
    global.iv = iv;
};

const connect = async() => {
    const responseSendMode = await sendMode();

    if (responseSendMode !== "Success") return;

    const responseGetPrivateKey = await getPrivateKey();
    if (responseGetPrivateKey !== "Success") return;

    const responseSendPrivateKey = await sendPrivateKey();
    if (responseSendPrivateKey !== "Success") return;

    const responseSendEncryptedFile = await sendEncryptedFile();
    if (responseSendEncryptedFile !== "Success") return;
};

const fileToBlocks = () => {
    return new Promise((resolve, reject) => {
        fs.readFile("file.txt", "utf8", (err, data) => {
            if (err) {
                reject(err);
            }
            blocks = data.match(new RegExp(".{1," + 8 + "}", "g"));
            resolve(blocks);
        });
    });
};

const ECBencrypt = (blocks) => {
    let encryptedBlocks = blocks.map((block) =>
        AES.encrypt(block, global.privateKey).toString()
    );
    return encryptedBlocks;
};

const CFBencrypt = (blocks) => {
    var encryptedBlocks = [];
    var blockCipher = AES.encrypt(global.iv, global.privateKey).toString();

    for (let i = 0; i < blocks.length; i++) {
        encryptedBlocks[i] = XOR(blockCipher, blocks[i]);
        blockCipher = AES.encrypt(encryptedBlocks[i], global.privateKey).toString();
    }
    return encryptedBlocks;
};

const sendEncryptedFile = async() => {
    let blocks = await fileToBlocks();
    let encryptedBlocks = [];
    if (global.mode === "ECB") {
        encryptedBlocks = ECBencrypt(blocks);
    } else {
        encryptedBlocks = CFBencrypt(blocks);
    }
    const response = await fetch(`${B}message`, {
        method: "POST",
        headers: {
            "Content-type": "application/json",
        },
        body: JSON.stringify({ encrypted: encryptedBlocks }),
    });
    if (response.status !== 200) {
        console.log("Problem occured during run. Status Code: " + response.status);
        return;
    }

    return "Success";
};

const sendMode = async() => {
    const response = await fetch(`${B}operating/mode`, {
        method: "POST",
        headers: {
            "Content-type": "application/json",
        },
        body: JSON.stringify({
            mode: global.mode,
        }),
    });
    if (response.status !== 200) {
        console.log("Problem occured during run. Status Code: " + response.status);
        return;
    }

    return "Success";
};

const getPrivateKey = async() => {
    const response = await fetch(`${KeyManager}private/key`);

    if (response.status !== 200) {
        console.log("Problem occured during run. Status Code: " + response.status);
        return;
    }
    const result = await response.json();
    global.privateKey = AES.decrypt(result.encrypted, global.publicKey).toString(
        CryptoJS.enc.Utf8
    );

    return "Success";
};

const sendPrivateKey = async() => {
    const encryptedPrivateKey = AES.encrypt(global.privateKey, global.publicKey);
    const response = await fetch(`${B}setup`, {
        method: "post",
        headers: {
            "Content-type": "application/json",
        },
        body: JSON.stringify({
            encrypted: encryptedPrivateKey.toString(),
        }),
    });

    if (response.status !== 200) {
        console.log("Problem occured during run. Status Code: " + response.status);
        return;
    }
    return "Success";
};

function XOR(a, b) {
    let s = "";
    for (let i = 0; i < Math.min(a.length, b.length); i++) {
        s += String.fromCharCode((a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0));
    }
    return s;
}

const Protocol = function() {};
Protocol.prototype.initialize = initialize;
Protocol.prototype.connect = connect;
Protocol.prototype.B = B;
Protocol.prototype.KeyManager = KeyManager;
module.exports = new Protocol();