const { JiraClient } = require("../clients/jira");
const { getPrismaClient } = require("../config/prisma");

const Prisma = getPrismaClient();

const listAllOrganization = async (req, res) => {
  const data = await Prisma.organization.findMany({});
  res.json({ data });
};

// Temp (need to set auth and get the exact org)
const getOrgDetails = async (req, res) => {
  const { id } = req.params;
  if (!id) throw new Error("Unknwon id");
  const data = await Prisma.organization.findUnique({
    where: {
      id,
    },
  });
  res.json({ data });
};

const createOrganization = async (req, res) => {
  const { id } = req.params;
  if (!id) throw new Error("Invalid organization");
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
  const data = await Prisma.organization.create({
    data: {
      cloudId: id,
      name,
    },
  });
  return res.json({ success: true, data });
};

module.exports = {
  getOrgDetails,
  createOrganization,
  listAllOrganization,
};
