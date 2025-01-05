const { getPrismaClient } = require("../config/prisma");
const { generate } = require("../config/gemini");
const Prisma = getPrismaClient();

const messages = [];
let employee = null;

const chatWithBuddy = async (req, res) => {
  const empId = req.auth.empId;
  if (employee && employee !== empId)
    throw new Error("You can chat with only one buddy at a time");
  employee = empId;
  const message = req.body.message || req.query.message;
  const tasksData = await Prisma.tasks.findMany({
    where: {
      employeeId: empId,
      status: {
        not: "CLOSED",
      },
    },
  });
  const filteredTask = tasksData.map((el) => {
    return {
      title: el.title,
      description: el.description,
      status: el.status,
      priority: el.priority,
      estimatedTime: el.maxMinutesString,
    };
  });
  const employeeData = await Prisma.employee.findUnique({
    where: {
      id: empId,
    },
    include: {
      Department: {
        include: {
          Manager: true,
        },
      },
    },
  });
  const manager = employeeData.Department?.Manager[0].name;

  const assesmentsCount = employeeData.assesments.filter(
    (el) => !el.isCompleted
  ).length;

  const getConversation = () => {
    if (messages.length) {
      return `Our chat history : ${JSON.stringify(
        messages
      )}, Now reply my upcoming messages, ${message}`;
    }
    return `Hi Gemini, 
    I am ${employeeData.name}, and my manager is ${manager}. 
    We’re starting a conversation where you’ll act as my partner, mentor, or manager as needed. 
    Analyze my communication to understand my state. I have ${JSON.stringify(
      filteredTask
    )} tasks and ${assesmentsCount} assessments assigned by my manager. 
    Reply in JSON: {response: string, action: null,subject:null}. 
    Use "action: INFORM_MANAGER" only if I ask you to inform the manager about my state or you feels that i cant work today or needs help (ask me before informing).
     and "subject is the content that you (You gemini) to send to the manager. With my name and manager name as well. 
     Ask me if you have any doubt about the content". 
    Support me mentally and technically, but don’t mention this message again in our future chats. Never mind. Now reply my upcoming messages
    Here’s my message: ${message}`;
  };

  const prompt = getConversation();

  let response = await generate(prompt);

  messages.push({
    fromMe: prompt,
    fromYou: response,
  });

  const isJson = response.includes("{");
  if (isJson) {
    response = JSON.parse(
      response.slice(response.indexOf("{"), response.lastIndexOf("}") + 1)
    );
    if (response.action?.length) {
      response = {
        response: response.response,
        toManager: response.subject || "waiting for confirmation....",
      };
    }
  }

  res.json({ ...response });
};

module.exports = {
  chatWithBuddy,
};
