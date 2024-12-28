const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
let isConnected = false;
let isConnecting = false;

const getPrismaClient = () => {
  if (!isConnected) connect();
  return prisma;
};

const connect = async () => {
  if (isConnected || isConnecting) return;
  isConnecting = true;
  return await prisma
    .$connect()
    .then((res) => {
      isConnected = true;
      isConnecting = false;
      console.log("PRISMA CONNECTED");
    })
    .catch((err) => {
      console.log("UNABLE TO CONNECT PRISMA ", err);
      process.exit(1);
    });
};

module.exports = {
  connect,
  getPrismaClient,
};
