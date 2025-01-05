const { PrismaClient } = require("@prisma/client");

const tasks = require("./tasks");

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
        email: "manager@acodez.co.in",
        password: bcrypt.hashSync("test", process.env.BCRYPT_SALT),
        name: "test",
        departmentId: department.id,
        cloudId: "d1a394g2-1a1b-4f2a-89fc-6c7f6j99d773",
      },
    });
    const role = await prisma.roles.create({
      data: {
        name: "Developer",
        requiredSkills: ["Javascript", "GO", "React"],
        suggestedCourses: ["https://www.youtube.com/watch?v=FxYuC48O4Wk"],
      },
    });
    const employee = await prisma.employee.create({
      data: {
        name: "test",
        email: "employee@acodez.co.in",
        password: bcrypt.hashSync("test", process.env.BCRYPT_SALT),
        Organization: {
          connect: {
            id: organization.id,
          },
        },
        Department: {
          connect: {
            id: department.id,
          },
        },
        role: {
          connect: {
            id: role.id,
          },
        },
      },
    });

    const project = await prisma.projects.create({
      data: {
        name: "Task manangment",
        key: "TSKMGMT",
        leadId: manager.id,
        leadName: manager.name,
        orgId: organization.id,
        cloudId: "d1a398e2-1a1b-4f2a-89fc-6c7f6j99d773",
      },
    });

    for (const task of tasks) {
      await prisma.tasks.create({
        data: {
          title: task.title,
          minMinutes: task.maxTimeMinutes,
          minMinutesString: task.minTimeString,
          maxMinutes: task.maxTimeMinutes,
          maxMinutesString: task.maxTimeString,
          complexity: task.complexity,
          Project: {
            connect: {
              id: project.id,
            },
          },
          isAssigned: true,
          Employee: {
            connect: {
              id: employee.id,
            },
          },
          status: task.status,
          priority: task.priority,
        },
      });
    }
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
