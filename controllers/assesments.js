const { generate } = require("../config/gemini");
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
      roleId,
    },
  });
  res.json({ data });
};

const createAssesment = async (req, res) => {
  const {
    name,
    roleId,
    generateByAi = true,
    difficulty = "medium",
    totalPoints = 100,
    customPrompt,
    pointsPerQuestion = 10,
    questions,
    totalQuestions = 10,
  } = req.body;

  const roleData = await Prisma.roles.findUnique({
    where: {
      id: roleId,
    },
  });

  if (!roleData) throw new Error("Invalid role id");
  if (generateByAi) {
    const prompt =
      customPrompt ||
      `Generate minimum ${totalQuestions} ${difficulty} Question and oneword Answers related to ${roleData.requiredSkills.toString()} and also give options. return or repond only in the json format {id:{question,answer,options}} format. Dont need additional show off`;
    let response = await generate(prompt);

    let data = {};

    if (prompt.includes("json")) {
      response = JSON.parse(
        response.slice(response.indexOf("{"), response.lastIndexOf("}") + 1)
      );

      const questions = Object.values(response).map((item) => {
        return {
          question: item.question,
          answer: item.answer,
          options: item.options,
        };
      });
      data = {
        name,
        pointsPerQuestion,
        aiPrompt: prompt,
        aiJsonResponse: response,
        isManuallyAdded: false,
        totalPoints,
        questions,
        roleId,
      };
    } else
      data = {
        name,
        pointsPerQuestion,
        aiPrompt: prompt,
        aiResponse: response,
        isManuallyAdded: false,
        totalPoints,
        roleId,
      };

    const assesmentData = await Prisma.assesments.create({
      data,
    });

    return res.json({
      success: true,
      assesmentData,
    });
  }
  const data = await Prisma.assesments.create({
    data: {
      name,
      pointsPerQuestion,
      questions,
      isManuallyAdded: true,
      totalPoints,
      roleId,
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
