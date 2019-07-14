const rp = require("./index");
const fs = require("fs");

const argv = process.argv.slice(2);
const filename = argv[0];

const stream = fs.createReadStream(filename);

const ev = rp(stream);

ev.on("error", console.log);

ev.on("header", header => {
  console.log(header.toString("hex"));
});

ev.on("chunk", ({ type, data }) => {
  if (data.length >= 20) {
    data = data.slice(0, 20).toString("hex") + "...";
  } else {
    data = data.toString("hex");
  }
  console.log(`${type}: ${data}`);
});
