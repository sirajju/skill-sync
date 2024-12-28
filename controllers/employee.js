const { getPrismaClient } = require("../config/prisma");

const Prisma = getPrismaClient();

const listEmployees = async (req, res) => {
  const data = await Prisma.employee.findMany({});
  res.json({ data });
};

// Temp (need to set auth and get the exact org)
const getEmployeeDetails = async (req, res) => {
  const { id } = req.params;
  if (!id) throw new Error("Unknwon id");
  const data = await Prisma.employee.findUnique({
    where: {
      id,
    },
    include:{
      organization:true,
      role:true,
    }
  });
  res.json({ data });
};

// Create an employee under an organization
const createEmployee = async (req, res) => {
  const { name, goals, orgId, age, email, roleId } = req.body;
  if (!orgId) throw new Error("Invalid Organization");
  const data = await Prisma.employee.create({
    data: {
      name,
      email,
      goals,
      age: parseInt(age),
      orgId,
      roleId,
    },
  });
  return res.json({ data });
};

const updateEmployee = async (req, res) => {
  const { id } = req.params;
  if (id) throw new Error("Invalid employee");
  const structure = [
    "name",
    "age",
    "email",
    "goals",
    "currentBadgeId",
    "points",
    "role",
  ];
  const updateData = {};
  for (let [key, value] in req.body) {
    if (structure.includes(key)) {
      updateData[key] = value;
    }
  }
  const data = await Prisma.employee.update({
    where: {
      id,
    },
    data: updateData,
  });
  return res.json({ data });
};

module.exports = {
  getEmployeeDetails,
  createEmployee,
  listEmployees,
  updateEmployee,
};
