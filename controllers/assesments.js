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

  let data = {};

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

    const isFailedToGenerate = /sorry/i.test(response);

    if (isFailedToGenerate) throw new Error("Oh no!. I am sorry i can't do it");

    const isJson = response.includes("{");
    let questions = response;

    if (isJson) {
      response = JSON.parse(
        response.slice(response.indexOf("{"), response.lastIndexOf("}") + 1)
      );
      const { id } = response;
      questions = Object.values(id).map((item) => {
        return {
          question: item.question,
          answer: item.answer,
          options: item.options,
        };
      });
    }
    let { estimatedTime = 1000 * 5, estimatedTimeString = "5 Minutes" } =
      typeof response == "object" ? response : {};
    const createData = {
      name,
      pointsPerQuestion,
      aiPrompt: prompt,
      estimatedTimeString,
      estimatedTime,
      ...(isJson && { [isJson ? "aiJsonResponse" : "aiResponse"]: response }),
      isManuallyAdded: false,
      totalPoints,
      questions,
      roleId,
    };
    data = await Prisma.assesments.create({
      data: createData,
    });
  } else {
    data = await Prisma.assesments.create({
      data: {
        name,
        pointsPerQuestion,
        questions,
        isManuallyAdded: true,
        totalPoints,
        roleId,
        estimatedTime,
        estimatedTimeString,
      },
    });
  }

  const employees = await Prisma.employee.findMany({
    where: {
      roleId: roleData.id,
    },
  });

  for (const employee of employees) {
    const assesments = employee.assesments || [];

    await Prisma.employee.update({
      where: {
        id: employee.id,
      },
      data: {
        assesments: [
          ...assesments,
          {
            id: data.id,
            isCompleted: false,
            allowedTime: data.estimatedTime,
            allowedTimeString: data.estimatedTimeString,
            createdAt: new Date(),
          },
        ],
      },
    });
  }

  return res.json({ ...data, aiPrompt: "Nothing here. That’s all we know." });
};

const updateAssesment = async (req, res) => {
  const { id } = req.params;
  // req.body should be like thissss { empId, questions:[{question:string,options:[string] answer:string}] }
  const { empId, questions } = req.body;
  if (!id || !empId) throw new Error("Unknwon assesment/employee id");
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

  const employeeData = await Prisma.employee.findUnique({
    where: {
      id: empId,
    },
  });

  if (!employeeData)
    throw new Error(`Are you sure that employee(${empId}) is exists ?`);

  const assesments = employeeData.assesments || [];

  if (assesments.find((el) => el.id == id && el.isCompleted == true))
    throw new Error(`Looks like already submitted this assesment ${id}`);

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
  const isJson = response.includes("{");
  const isAnswerJson = answerResponse.includes("{");
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
  if (response && answerResponse) {
    const updateData = await Prisma.employee.update({
      where: {
        id: employeeData.id,
      },
      data: {
        assesments: [...assesments].map((el) => {
          if (el) {
            if (el.id == id) {
              return {
                ...el,
                isCompleted: true,
                completedAt: new Date(),
                score: answerResponse.score,
              };
            }
            return el;
          }
        }),
      },
    });

    return res.json({
      ...response,
      ...answerResponse,
      suggestedCoursesLink: roleData.suggestedCourses,
    });
  }
  return res.json({ message: "Oh no!, Something went wrong", success: false });
};

module.exports = {
  getAssessmentDetails,
  createAssesment,
  listAllAssesments,
  getAssesmentByRole,
  updateAssesment,
};
