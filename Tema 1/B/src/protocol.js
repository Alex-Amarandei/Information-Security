const fetch = require("cross-fetch");
const KeyManager = "http://localhost:3030/";

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

const Protocol = function() {};
Protocol.prototype.initialize = initialize;
Protocol.prototype.KeyManager = KeyManager;

module.exports = new Protocol();