const rabbitmq = require("amqplib");
const { GoogleGenerativeAI } = require("@google/generative-ai");

let currentApiKey = process.env.GEMINI_API_KEY;

const primarykey = process.env.GEMINI_API_KEY;
const secondaryApiKey = process.env.GEMINI_SECONDARY_API_KEY;

const switchGeminiApikey = () => {
  return (currentApiKey =
    currentApiKey === primarykey ? secondaryApiKey : primarykey);
};

const genAI = new GoogleGenerativeAI(currentApiKey);
const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL });

const connect = async () => {
  try {
    const connection = await rabbitmq.connect({
      vhost: "/",
      hostname: "localhost",
      username: "admin",
      password: "admin",
    });
    const channel = await connection.createChannel();
    const queue = await channel.assertQueue("gemini_queue", {
      durable: true,
    });

    channel.consume(queue.queue, (message) => {
      if (!message.content.includes("[NODE]"))
        console.log(`Received from gemini: ${message.content.toString()}`);
    });
    return channel;
  } catch (error) {
    console.error(error);
  }
};

const waitFor3Seconds = () => {
  return new Promise((resolve) => {
    setTimeout(resolve, 3000);
  });
};

const generate = async (question) => {
  try {
    await waitFor3Seconds();
    const response = await model.generateContent(question);
    return response.response.text();
  } catch (error) {
    console.error(error);
    return JSON.stringify({
      message:
        "I am sorry, I am unable to reponse to your query. Please try again later. error : " +
        error,
    });
  }
};

const start = async () => {
  prompt =
    "(Reply in mid short) , My name is sirajju , and i have some points in learning out of 10 for each languages. python:6 , javascript:9 , golang:1 ";

  console.log(
    "\nWelcome to Gemini! I am here to help you with your queries. Please ask me anything.\nI will try to answer it to the best of my knowledge.\nIf I am unable to answer, I will ask for help from the user. Let's get started!\n"
  );

  const response = await generate(prompt);
  console.log("\n" + response);
};

module.exports = {
  connect,
  generate,
  start,
  switchGeminiApikey,
};
