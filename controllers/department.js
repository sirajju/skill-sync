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
  const { name, skills, managerId } = req.body;
  if (!name || !skills?.length || !managerId)
    throw new Error("Invalid department");
  const data = await Prisma.department.create({
    data: {
      name,
      requiredSkills: skills,
      Manager: {
        connect: {
          id: managerId,
        },
      },
    },
  });
  return res.json({ data });
};

module.exports = {
  getDepartmentDetails,
  createDepartment,
  listAllDepartments,
};
