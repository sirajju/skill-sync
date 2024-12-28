const { getPrismaClient } = require("../config/prisma");

const Prisma = getPrismaClient();

const listAllOrganization = async (req, res) => {
  const data = await Prisma.organization.findMany({});
  res.json({ data });
};

// Temp (need to set auth and get the exact org)
const getOrgDetails = async (req, res) => {
  const { id } = req.params;
  if (!id) throw new Error("Unknwon id");
  const data = await Prisma.organization.findUnique({
    where: {
      id,
    },
  });
  res.json({ data });
};

const createOrganization = async (req, res) => {
  const { name, goals } = req.body;
  if (!name || !goals?.length) throw new Error("Invalid organization");
  const data = await Prisma.organization.create({
    data: {
      name,
      goals,
    },
  });
  return res.json({ data });
};

module.exports = {
  getOrgDetails,
  createOrganization,
  listAllOrganization,
};
