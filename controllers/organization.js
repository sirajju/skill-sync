const { JiraClient } = require("../clients/jira");
const { getPrismaClient } = require("../config/prisma");
const { generate } = require("../config/gemini");
const Prisma = getPrismaClient();

const listAllOrganization = async (req, res) => {
  const data = await Prisma.organization.findMany({});
  res.json({ data });
};

// Temp (need to set auth and get the exact org)
const getOrgDetails = async (req, res) => {
  const { orgId } = req.auth;
  if (!orgId) throw new Error("Unknwon id");
  const data = await Prisma.organization.findUnique({
    where: {
      id,
    },
  });
  res.json({ data });
};

const importIssues = async (cloudId) => {
  const data = await Prisma.organization.findUnique({
    where: {
      cloudId,
    },
  });
  const token = await Prisma.token.findUnique({
    where: {
      cloudId,
    },
  });
  const projects = await Prisma.projects.findMany({
    where: {
      orgId: data.id,
    },
  });

  for (const project of projects) {
    const response = await JiraClient.getBulkIssues(
      token.access_token,
      cloudId,
      project.name
    );
    const issues = response.data.issues;

    for (const issue of issues) {
      const employee = await Prisma.employee.findUnique({
        where: {
          email: issue.fields?.assignee?.emailAddress || "null",
        },
      });

      const taskData = {
        title: issue.fields.summary,
        description: issue.fields.description
          ? issue.fields.description.content[0].content[0].text
          : " Null",
        cloudId: issue.id,
        Project: {
          connect: {
            id: project.id,
          },
        },
        isAssigned: !!employee,
        ...(!!employee && {
          Employee: {
            connect: {
              id: employee.id,
            },
          },
        }),
      };

      const GeminiPrompt = `Provide task complexity,Minimum time to Complete, Maximum time to complete by analyzing the task summary and description.And also please not that the estimated min and max time should be calculated by analyzing the complexity and also the employees break and his/her mental state. I believe that giving a min 3 hour for complexity 1 would be better. and so on. Please provide in json format without addional texts, and the response format should be like this {complexity:Float (0 to 10),minTimeMinutes:Int,minTimeString:String,maxTimeMinutes:Int,maxTimeString:String,...additional_information(add the key if have the value else dont add)} Task Data : ${JSON.stringify(
        taskData
      )}`;

      const GeminiResponse = await generate(GeminiPrompt);

      if (GeminiResponse.includes("{")) {
        const GeminiJsonResponse = JSON.parse(
          GeminiResponse.slice(
            GeminiResponse.indexOf("{"),
            GeminiResponse.lastIndexOf("}") + 1
          )
        );

        await Prisma.tasks.create({
          data: {
            ...taskData,
            aiResponse: GeminiResponse,
            aiJsonResponse: GeminiJsonResponse,
            minMinutes: GeminiJsonResponse.minTimeMinutes,
            minMinutesString: GeminiJsonResponse.minTimeString,
            maxMinutes: GeminiJsonResponse.maxTimeMinutes,
            maxMinutesString: GeminiJsonResponse.maxTimeString,
            complexity: GeminiJsonResponse.complexity,
          },
        });
      } else throw new Error("Err while importing tasks");
    }
  }
};

const getProject = async (cloudId) => {
  const data = await Prisma.organization.findUnique({
    where: {
      cloudId,
    },
  });
  const token = await Prisma.token.findUnique({
    where: {
      cloudId,
    },
  });
  const { data: projects } = await JiraClient.getProjectDetails(
    token.access_token,
    cloudId,
    data.name
  );

  if (projects) {
    const projectSelfUrls = projects.map((project) => project.self);
    const projectDetails = await Promise.all(
      projectSelfUrls.map((url) =>
        JiraClient.getProject(url, token.access_token)
      )
    );
    const filteredProjectData = projectDetails.map((project) => project.data);

    if (!filteredProjectData.length) throw new Error("No projects found");

    for (const project of filteredProjectData) {
      const isExists = await Prisma.projects.findUnique({
        where: {
          cloudId: project.id,
        },
      });

      if (!isExists) {
        await Prisma.projects.create({
          data: {
            cloudId: project.id,
            name: project.name,
            description: project.description,
            key: project.key,
            projectTypeKey: project.projectTypeKey,
            issueTypes: project.issueTypes,
            orgId: data.id,
            leadName: project.lead.displayName,
            leadId: project.lead.accountId,
          },
        });
      }
    }
    importIssues(cloudId);
  }
  return true;
};

const createOrganization = async (req, res) => {
  const { id } = req.params;
  if (!id || id == "undefined") throw new Error("Invalid organization");

  const isExists = await Prisma.organization.findFirst({
    where: {
      cloudId: id,
    },
  });
  if (isExists) return res.json({ message: "Organization already exists" });
  const tokenData = await Prisma.token.findUnique({
    where: {
      cloudId: id,
    },
  });
  if (!tokenData) throw new Error("Invalid token");
  const organizationDetails = await JiraClient.getOrganizationDetails(
    tokenData.access_token,
    id
  );
  if (!organizationDetails) throw new Error("Invalid organization details");
  const { name, url, avatarUrl, scopes } = organizationDetails;
  const webHookData = {
    name: "Issue Created",
    url: `${process.env.WEBHOOK_BASE_URI}`,
    webhooks: [
      {
        events: [
          "jira:issue_created",
          "jira:issue_updated",
          "jira:issue_deleted",
        ],
        jqlFilter: "project = 'TEST'",
      },
    ],
  };
  const response = await JiraClient.createWebhook(
    tokenData.access_token,
    id,
    webHookData
  );

  if (response.status !== 200) throw new Error("Error creating webhook");

  const createdWebhooks = await JiraClient.listWebhooks(
    tokenData.access_token,
    id
  );

  const ORG = await Prisma.organization.create({
    data: {
      cloudId: id,
      name,
      webhookData: createdWebhooks.data,
    },
  });
  res.json({
    message: "Organization created successfully , Projects being imported",
    success: true,
  });
  try {
    getProject(id);
  } catch (error) {
    console.log("Err while imporing", error);
  }
  const employeeResponse = await JiraClient.getEmployeeDetails(
    tokenData.access_token,
    ORG.cloudId
  );
  if (!employeeResponse.data) throw new Error("Invalid employee details");

  const employees = employeeResponse.data;

  const atlassianAccounts = employees.filter(
    (employee) => employee.accountType === "atlassian"
  );

  for (const employee of atlassianAccounts) {
    await Prisma.employee.create({
      data: {
        name: employee.displayName,
        email: employee.emailAddress,
        cloudId: employee.accountId,
        Organization: {
          connect: {
            id: ORG.id,
          },
        },
      },
    });
  }
};

module.exports = {
  getOrgDetails,
  createOrganization,
  listAllOrganization,
  getProject,
};
