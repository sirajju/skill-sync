const { getPrismaClient } = require("../config/prisma");

const Prisma = getPrismaClient();

const listManagers = async (req, res) => {
  const data = await Prisma.manager.findMany({});
  res.json({ data });
};

const getManagerDetails = async (req, res) => {
  const { id } = req.params;
  if (!id) throw new Error("Unknwon id");
  const data = await Prisma.manager.findUnique({
    where: {
      id,
    },
    include: {
      Department: true,
    },
  });
  res.json({ data });
};

const createManager = async (req, res) => {
  const { name, departmentId, email } = req.body;
  if (!departmentId) throw new Error("Invalid Department");
  const data = await Prisma.manager.create({
    data: {
      name,
      email,
      departmentId,
    },
  });
  return res.json({ data });
};

module.exports = {
  getManagerDetails,
  createManager,
  listManagers,
};
