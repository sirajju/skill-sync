const { getPrismaClient } = require("../config/prisma");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Prisma = getPrismaClient();
const { generate } = require("../config/gemini");

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
      Department: true,
      Organization: true,
      role: true,
      Tasks: true,
    },
  });
  res.json({ data });
};

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

const loginEmployee = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new Error("Invalid email or password");
  const data = await Prisma.employee.findUnique({
    where: {
      email,
    },
    include: {
      Organization: true,
      Department: true,
      Tasks: true,
      role: true,
    },
  });
  if (!data) return res.json({ message: "No data" });
  const isPasswordMatched = bcrypt.compareSync(password, data.password);
  if (!isPasswordMatched) return res.json({ message: "No data" });
  const token = await jwt.sign(
    {
      id: data.id,
      orgId: data.Organization.id,
      ...data,
    },
    process.env.JWT_SECRET
  );
  return res.json({ data: token, ...data });
};

const getEmployeeStatus = async (req, res) => {
  const empId = req.auth.empId;
  const employeeData = await Prisma.employee.findUnique({
    where: {
      id: empId,
    },
  });
  const tasksData = await Prisma.tasks.findMany({
    where: {
      employeeId: empId,
    },
    include: {
      Project: {
        select: {
          name: true,
        },
      },
    },
  });
  const closedTasks = [];
  const openedTasks = [];
  if (tasksData && tasksData.length) {
    tasksData.filter((el) =>
      el.status == "CLOSED" ? closedTasks.push(el) : openedTasks.push(el)
    );
  }

  const pendingAssesments = [];
  const completedAssesments = [];

  if (employeeData?.assesments && employeeData.assesments.length) {
    employeeData.assesments.filter((el) =>
      el.isCompleted ? completedAssesments.push(el) : pendingAssesments.push(el)
    );
  }

  const workStatus = employeeData.isAfk
    ? "Currently unable to work because of some reasons"
    : "Currently working";

  const data = {
    closedTasks,
    openedTasks,
    pendingAssesments,
    completedAssesments,
    workStatus,
  };

  const prompt = `Analyze employee recent/pending works ${JSON.stringify(
    data
  )} and generate a feedback about employee work status of this month ${new Date().toLocaleDateString()}. Reply in mid short`;

  const feedback = await generate(prompt);

  res.json({
    ...data,
    closedTasks: closedTasks.length,
    openedTasks: openedTasks.length,
    pendingAssesments: pendingAssesments.length,
    completedAssesments: completedAssesments.length,
    feedback,
  });
};

module.exports = {
  getEmployeeDetails,
  createEmployee,
  listEmployees,
  updateEmployee,
  loginEmployee,
  getEmployeeStatus,
};
