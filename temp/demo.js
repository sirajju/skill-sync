const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const bcrypt = require("bcrypt");

const create = async () => {
  try {
    const organization = await prisma.organization.create({
      data: {
        name: "acodez-junior",
        goals: ["GO", "JAVASCRIPT"],
      },
    });
    const department = await prisma.department.create({
      data: {
        requiredSkills: ["GO", "JAVASCRIPT"],
        name: "Acowebs",
        orgId: organization.id,
      },
    });
    const manager = await prisma.manager.create({
      data: {
        email: "test@acodez.co.in",
        password: bcrypt.hashSync("test", process.env.BCRYPT_SALT),
        name: "test",
        departmentId: department.id,
      },
    });
  } catch (error) {
    console.warn(
      "ERR, Never mind . Its me creating (duplicate) demo data ./temp/demo"
    );
  }
};

const clear = async () => {
  try {
    const organization = await prisma.organization.deleteMany();
    const department = await prisma.department.deleteMany();
    const manager = await prisma.manager.deleteMany();
    const employee = await prisma.employee.deleteMany();
    const token = await prisma.token.deleteMany();
    const project = await prisma.projects.deleteMany();
    const tasks = await prisma.tasks.deleteMany();
  } catch (error) {}
  console.log("Cleared all data");
};

module.exports = {
  create,
  clear,
};
