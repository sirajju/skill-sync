const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const bcrypt = require("bcrypt");

const create = async () => {
  try {
    const organization = await prisma.organization.create({
      data: {
        name: "acodez",
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
    console.log('ERR, Never mind . Its me creating (duplicate) demo data');
    
  }
};

module.exports = {
  create,
};
