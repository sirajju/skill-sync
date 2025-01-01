const { getPrismaClient } = require("../config/prisma");

const Prisma = getPrismaClient();

const listAllRoles = async (req, res) => {
  const data = await Prisma.roles.findMany();
  res.json({ data });
};

const getRoleDetails = async (req, res) => {
  const { id } = req.params;
  if (!id) throw new Error("Unknwon id");
  const data = await Prisma.roles.findUnique({
    where: {
      id,
    },
  });
  res.json({ data });
};

const createRole = async (req, res) => {
  const { name, skills, suggestedCourses } = req.body;
  if (!name || !skills?.length) throw new Error("Invalid role");
  console.log(skills);

  const data = await Prisma.roles.create({
    data: {
      name,
      requiredSkills: JSON.parse(skills),
      suggestedCourses: JSON.parse(suggestedCourses),
    },
  });
  return res.json({ data });
};

module.exports = {
  getRoleDetails,
  createRole,
  listAllRoles,
};
