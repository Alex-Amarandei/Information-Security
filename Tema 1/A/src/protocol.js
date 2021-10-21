const fs = require("fs");
const fetch = require("cross-fetch");
const KeyManager = "http://localhost:3030/";
const B = "http://localhost:3032/";
const AES = require("crypto-js/aes");
const CryptoJS = require("crypto-js");

const initialize = async() => {
    const response = await fetch(`${KeyManager}start`);
    if (response.status !== 200) {
        console.log("Problem occured during run. Status Code: " + response.status);
        return;
    }
    const { publicKey, iv } = await response.json();
    global.publicKey = publicKey;
    global.iv = iv;
};

const start = async() => {
    const responseSendMode = await sendMode();
    if (responseSendMode !== "Completed") return;

    const responseGetPrivateKey = await getPrivateKey();
    if (responseGetPrivateKey !== "Completed") return;

    const responseSendPrivateKey = await sendPrivateKey();
    if (responseSendPrivateKey !== "Completed") return;

    const responseSendEncryptedFile = await sendEncryptedFile();
    if (responseSendEncryptedFile !== "Completed") return;

    console.log("Everything went accordingly.");
};

const fileToBlocks = () => {
    return new Promise((resolve, reject) => {
        fs.readFile("input.txt", "utf8", (err, data) => {
            if (err) {
                reject(err);
            }
            blocks = data.match(new RegExp(".{1," + 8 + "}", "g"));
            resolve(blocks);
        });
    });
};

const ECBencrypt = (blocks) => {
    let encrypted = [];
    blocks.forEach((block) => {
        encrypted.push(AES.encrypt(block, global.privateKey).toString());
    });

    return encrypted;
};

const CFBencrypt = (blocks) => {
    var encrypted = [];
    var cipher = AES.encrypt(global.iv, global.privateKey).toString();

    for (let i = 0; i < blocks.length; i++) {
        encrypted[i] = XOR(cipher, blocks[i]);
        cipher = AES.encrypt(encrypted[i], global.privateKey).toString();
    }
    return encrypted;
};

const sendEncryptedFile = async() => {
    let blocks = await fileToBlocks();
    let encrypted = [];
    if (global.mode === "ECB") {
        encrypted = ECBencrypt(blocks);
    } else {
        encrypted = CFBencrypt(blocks);
    }
    const response = await fetch(`${B}text`, {
        method: "POST",
        headers: {
            "Content-type": "application/json",
        },
        body: JSON.stringify({ encrypted: encrypted }),
    });
    if (response.status !== 200) {
        console.log("Problem occured during run. Status Code: " + response.status);
        return;
    }

    return "Completed";
};

const sendMode = async() => {
    const response = await fetch(`${B}mode`, {
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

    return "Completed";
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

    return "Completed";
};

const sendPrivateKey = async() => {
    const encryptedPrivateKey = AES.encrypt(global.privateKey, global.publicKey);
    const response = await fetch(`${B}initialize`, {
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
    return "Completed";
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
Protocol.prototype.start = start;
Protocol.prototype.B = B;
Protocol.prototype.KeyManager = KeyManager;
module.exports = new Protocol();