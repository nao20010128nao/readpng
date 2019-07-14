const EventEmitter = require("events").EventEmitter;

function requireReadableBytes(readable, length, func, count) {
  if (count === undefined) {
    count = 5;
  }
  if (readable.readableLength >= length || count == 0) {
    setImmediate(func);
  } else {
    readable.once("readable", () =>
      requireReadableBytes(readable, length, func, count - 1)
    );
  }
}

module.exports = function(readable) {
  const ev = new EventEmitter();
  readable.once("readable", () => {
    const header = readable.read(8);
    if (!header) {
      ev.emit("error", new Error(`Reading header failed`));
    }
    ev.emit("header", header);
    const hhex = header.toString("hex");
    if (hhex !== "89504e470d0a1a0a") {
      ev.emit("error", new Error(`Invalid header, got ${hhex}`));
      return;
    }
    function chunkReadLoop() {
      const lengthBytes = readable.read(4);
      if (!lengthBytes) {
        return;
      }
      const type = readable.read(4).toString("utf8");
      const length = parseInt(lengthBytes.toString("hex"), 16);
      requireReadableBytes(readable, length + 4, () => {
        const data = length ? readable.read(length) : Buffer.alloc(0);
        const crc = readable.read(4);
        ev.emit("chunk", { lengthBytes, type, length, data, crc });
        if (type.toLowerCase() !== "iend") {
          requireReadableBytes(readable, 8, chunkReadLoop);
        }
      });
    }
    requireReadableBytes(readable, 8, chunkReadLoop);
  });
  return ev;
};
