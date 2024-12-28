const { getPrismaClient } = require("../config/prisma");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

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
  const { name, departmentId, email, password } = req.body;
  if (!departmentId) throw new Error("Invalid Department");
  const hashedPassword = await bcrypt.hashSync(
    password,
    process.env.BCRYPT_SALT
  );
  const data = await Prisma.manager.create({
    data: {
      name,
      email,
      departmentId,
      password: hashedPassword,
    },
  });
  return res.json({ data });
};

const loginManager = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new Error("Invalid email or password");
  const data = await Prisma.manager.findUnique({
    where: {
      email,
    },
    include: {
      Department: {
        include: {
          Organization: true,
        },
      },
    },
  });
  if (!data) return res.json({ message: "No data" });
  const isPasswordMatched = bcrypt.compareSync(password, data.password);
  if (!isPasswordMatched) return res.json({ message: "No data" });
  const token = await jwt.sign(
    {
      id: data.Department.orgId,
      ...data,
    },
    process.env.JWT_SECRET
  );
  return res.json({ data: token });
};

module.exports = {
  getManagerDetails,
  createManager,
  listManagers,
  loginManager,
};
