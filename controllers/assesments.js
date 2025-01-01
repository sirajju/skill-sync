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
      `Generate a minimum of ${totalQuestions} ${difficulty} questions and one-word answers related to ${roleData.requiredSkills.toString()}, include options for each, and respond only in JSON format: {"estimatedTimeString":"exact strict time (e.g., '5 minutes')","estimatedTime":integer (e.g., 5),"id":[{"question":"string","answer":"string","options":["option1","option2","option3","option4"]}]}; ensure time is strict, less than 10 minutes, and varies accurately based on difficulty level.`;
    let response = await generate(prompt);
    console.log(response);

    let data = {};
    const isJson = /json/i.test(response);
    if (isJson) {
      response = JSON.parse(
        response.slice(response.indexOf("{"), response.lastIndexOf("}") + 1)
      );

      const { estimatedTime, estimatedTimeString, id } = response;

      const questions = Object.values(id).map((item) => {
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
        estimatedTimeString,
        estimatedTime,
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
      ...assesmentData,
      aiPrompt: "Nothing here. That’s all we know.",
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
  return res.json({ ...data, aiPrompt: "Nothing here. That’s all we know." });
};

const updateAssesment = async (req, res) => {
  const { id } = req.params;
  // { empId, questions:{question:string, answer:string}[] }
  const { empId = "EMP_ID_456", questions } = req.body;
  if (!id || !empId) throw new Error("Unknwon id");
  const assesmentData = await Prisma.assesments.findUnique({
    where: {
      id,
    },
  });
  if (!assesmentData) throw new Error("Invalid assesment id");
  const { roleId } = assesmentData;
  const roleData = await Prisma.roles.findUnique({
    where: {
      id: roleId,
    },
  });

  const prompt = `Questions and answers are : ${JSON.stringify(
    questions
  )} Analyze the answers and questions provided by the employee with id ${empId} for the role ${
    roleData.name
  } for the skills ${
    roleData.requiredSkills
  } and provide feedback in JSON format: {"feedback":"string",needImprovements:["string (short)", "string (short)",...],suggestedCourses:[]}; ensure the feedback is constructive and accurate. And also suggest some courses for the employee to improve his skills.(dont need direct links. just the course names and the platform to search (udemy prefered))`;
  const answerPrompt = ` Questions and answers are : ${JSON.stringify(
    questions
  )}, Analyze the answers and questions provided by the employee with id ${empId} for the role and provide total points in JSON format: {"score":integer}; ensure the score is accurate.Not that there is a criteria for the score calculation. total points ${
    assesmentData.totalPoints
  } and points per question ${assesmentData.pointsPerQuestion}`;
  let response = await generate(prompt);
  let answerResponse = await generate(answerPrompt);
  const isJson = /json/i.test(response);
  const isAnswerJson = /json/i.test(answerResponse);
  if (isAnswerJson) {
    answerResponse = JSON.parse(
      answerResponse.slice(
        answerResponse.indexOf("{"),
        answerResponse.lastIndexOf("}") + 1
      )
    );
  }
  if (isJson) {
    response = JSON.parse(
      response.slice(response.indexOf("{"), response.lastIndexOf("}") + 1)
    );
  }
  res.json({
    ...response,
    ...answerResponse,
    suggestedCoursesLink: roleData.suggestedCourses,
  });
};

module.exports = {
  getAssessmentDetails,
  createAssesment,
  listAllAssesments,
  getAssesmentByRole,
  updateAssesment,
};
