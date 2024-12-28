const amqp = require("amqplib");

let channel = null;
let geminiQueue = null;

const connect = async () => {
  amqp.connect(process.env.RABBITMQ_URL).then(async (connection) => {
    console.log("RABBITMQ CONNECTED");
    const ConnectionChannel = await connection.createChannel();
    channel = ConnectionChannel;
    const queue = await ConnectionChannel.assertQueue(
      process.env.GEMINI_QUEUE,
      {
        durable: true,
      }
    );
    geminiQueue = queue.queue;
  });
};

const waitForLoadingResource = () => {
  return new Promise((res, rej) => {
    const myInterval = setInterval(() => {
      if (geminiQueue) {
        res();
        clearInterval(myInterval);
      }
    }, 100);
  });
};

const sendToGemini = async (string) => {
  if (!channel) await waitForLoadingResource();
  channel.sendToQueue(process.env.GEMINI_QUEUE, string);
};

module.exports = {
  connect,
  sendToGemini,
};