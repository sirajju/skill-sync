const { JiraClient } = require("../clients/jira");
const { getPrismaClient } = require("../config/prisma");

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
  return res.json({ message: "Organization created successfully" });
};

module.exports = {
  getOrgDetails,
  createOrganization,
  listAllOrganization,
};
