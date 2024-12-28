const { getPrismaClient } = require("../config/prisma");

const Prisma = getPrismaClient();

const listAllDepartments = async (req, res) => {
  const data = await Prisma.department.findMany();
  res.json({ data });
};

const getDepartmentDetails = async (req, res) => {
  const { id } = req.params;
  if (!id) throw new Error("Unknwon id");
  const data = await Prisma.department.findUnique({
    where: {
      OR: [
        {
          id,
        },
        {
          Manager: {
            some: {
              id,
            },
          },
        },
      ],
    },
  });
  res.json({ data });
};

const createDepartment = async (req, res) => {
  const { name, skills, orgId } = req.body;
  if (!name || !skills?.length) throw new Error("Invalid department");
  const data = await Prisma.department.create({
    data: {
      name,
      orgId,
      requiredSkills: JSON.parse(skills),
    },
  });
  return res.json({ data });
};

module.exports = {
  getDepartmentDetails,
  createDepartment,
  listAllDepartments,
};
