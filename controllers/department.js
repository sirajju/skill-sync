const { getPrismaClient } = require("../config/prisma");

const Prisma = getPrismaClient();

const listAllDepartments = async (req, res) => {
  const data = await Prisma.department.findMany({
    select: {
      Employee: true,
      Manager: true,
      Organization: true,
    },
  });
  res.json({ data });
};

const getDepartmentDetails = async (req, res) => {
  const { id } = req.params;

  if (!id) throw new Error("Unknwon id");
  const data = await Prisma.department.findUnique({
    where: {
      id,
    },
    include: {
      Employee: true,
      Organization: true,
      Manager: true,
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

const addEmployeeToDepartment = async (req, res) => {
  const { departmentId, empId } = req.body;
  if (!departmentId || !empId) throw new Error("Invalid department");
  const data = await Prisma.department.update({
    where: {
      id: departmentId,
    },
    data: {
      Employee: {
        connect: {
          id: empId,
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
  addEmployeeToDepartment,
};
