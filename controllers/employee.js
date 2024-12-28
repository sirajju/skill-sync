const { getPrismaClient } = require("../config/prisma");
const bcrypt = require("bcrypt");
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
    include: {
      organization: true,
      Department: true,
      role: true,
    },
  });
  res.json({ data });
};

// Create an employee under a department
const createEmployee = async (req, res) => {
  const {
    name,
    goals,
    departmentId,
    age,
    email,
    roleId,
    password,
    orgId = req.auth.orgId,
  } = req.body;

  if (!departmentId) throw new Error("Invalid Department");
  const hashedPassword = bcrypt.hashSync(password, process.env.BCRYPT_SALT);

  const data = await Prisma.employee.create({
    data: {
      name,
      email,
      goals,
      age: parseInt(age),
      roleId,
      departmentId,
      password: hashedPassword,
      orgId,
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
