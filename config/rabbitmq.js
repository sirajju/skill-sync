const amqp = require("amqplib");

let channel = null;
let geminiQueue = null;

const connect = async () => {
  amqp.connect(process.env.RABBITMQ_URL).then(async (connection) => {
    console.log("RABBITMQ CONNECTED");
    const ConnectionChannel = await connection.createChannel();
    const queue = await ConnectionChannel.assertQueue(
      process.env.GEMINI_QUEUE,
      {
        durable: true,
      }
    );
    channel = ConnectionChannel;
    geminiQueue = queue.queue;
  });
};

const waitForLoadingResource = () => {
  return new Promise((res, rej) => {
    const myInterval = setInterval(() => {
      if (channel) {
        res();
        clearInterval(myInterval);
      }
    }, 100);
  });
};

const registeredCallBacks = {};

const sendToGemini = async (content, key, callBack) => {
  registeredCallBacks[key] = callBack;
  if (!channel) await waitForLoadingResource();
  channel.sendToQueue(
    process.env.GEMINI_REQUEST_QUEUE,
    Buffer.from({
      key,
      content,
    })
  );
};

const listenGemini = async () => {
  try {
    if (!channel) await waitForLoadingResource();
    channel.consume(process.env.GEMINI_RESPONSE_QUEUE, (msg) => {
      const response = JSON.parse(msg.content.toString());
      const key = response.key;
      registeredCallBacks[key](key, response.content);
      acknowledgeMsg(msg);
    });
  } catch (error) {
    console.error("Something happened while processing msg", error);
  }
};

const acknowledgeMsg = (msg) => channel.ack(msg);

module.exports = {
  connect,
  sendToGemini,
  listenGemini,
  acknowledgeMsg,
};
