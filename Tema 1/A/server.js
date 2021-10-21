const http = require("http");
const readline = require("readline");

const Protocol = require("./src/protocol");
const port = 3031;

const server = http.createServer((req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
    res.setHeader(
        "Access-Control-Allow-Headers",
        "Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers"
    );
    if (req.method === "GET") {
        return handleGetReq(req, res);
    } else if (req.method === "POST") {
        return handlePostReq(req, res);
    } else if (req.method === "DELETE") {
        return res.end("DELETE");
    } else if (req.method === "PUT") {
        return handlePutReq(req, res);
    } else if (req.method === "OPTIONS") {
        return res.end("OPTIONS");
    }
});

async function handleGetReq(req, res) {}

async function handlePostReq(req, res) {}

function handlePutReq(req, res) {}

const handler = () => {
    const readLine = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    console.log("Please select the mode you wish to use:\n1 for ECB\n2 for CFB");
    readLine.on("line", async(cmd) => {
        switch (cmd) {
            case "1":
                global.mode = "ECB";
                console.log(
                    "Please type connect to connect or exit to exit the program."
                );
                break;

            case "2":
                global.mode = "CFB";
                console.log(
                    "Please type connect to connect or exit to exit the program."
                );
                break;

            case "connect":
                await Protocol.connect();
                break;

            case "exit":
                readLine.close();
                break;
        }
    });
};

server.listen(port, async() => {
    console.log(`Server listening on port ${port}`);
    Protocol.initialize();
    handler();
});