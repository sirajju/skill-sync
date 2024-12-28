const { getPrismaClient } = require("../config/prisma");
const { sendToGemini } = require("../config/rabbitmq");
const Prisma = getPrismaClient();

const listAllAssesments = async (req, res) => {
  const data = await Prisma.assesments.findMany();
  res.json({ data });
};

const getAssessmentDetails = async (req, res) => {
  const { id } = req.params;
  if (!id) throw new Error("Unknwon id");
  const data = await Prisma.assesments.findUnique({
    where: {
      id,
    },
  });
  res.json({ data });
};

const getAssesmentByRole = async (req, res) => {
  const { roleId } = req.params;
  if (!roleId) throw new Error("Unknwon id");
  const data = await Prisma.assesments.findUnique({
    where: {
      id,
    },
  });
  res.json({ data });
};

const createAssesment = async (req, res) => {
  const {
    name,
    roleId,
    generateByAi,
    difficulty = "medium",
    totalPoints,
  } = req.body;

  const roleData = await Prisma.roles.findUnique({
    where: {
      id: roleId,
    },
  });

  if (!roleData) throw new Error("Invalid role id");
  if (generateByAi) {
    const prompt = `Generate minimum 10 ${difficulty} Question and oneword Answers related to ${roleData.requiredSkills} and also give options. return or repond only in the json format {id:{question,answer,options}} format. Dont need additional show off`;
    sendToGemini(prompt);
    const data = await Prisma.assesments.create({
      data: {
        name,
        pointsPerQuestion,
        aiPrompt: prompt,
        isManuallyAdded: false,
        totalPoints,
        roleId,
      },
    });
    return res.json({
      success: true,
      message: "Generating , We will notify once its created",
      data,
    });
  }
  const data = await Prisma.assesments.create({
    data: {
      name,
      pointsPerQuestion,
      questions,
      isManuallyAdded: true,
    },
  });
  return res.json({ data });
};

module.exports = {
  getAssessmentDetails,
  createAssesment,
  listAllAssesments,
  getAssesmentByRole,
};
