const { getPrismaClient } = require("../config/prisma");
const { issue_created } = require("./JIRA");
const Prisma = getPrismaClient();

const onIssueCreated = async (req, res) => {
  const data = {
    createdAt: new Date(issue_created.timestamp),
    title: issue_created.issue.fields.summary,
    description,
  };
  await Prisma.tasks.create({
    data: {
      createdAt: new Date(issue_created.timestamp),
      title: issue_created.issue.fields.summary,
      description: issue_created.issue.fields.description,
      cloudId: issue_created.user.accountId,
      id: issue_created.issue.id,
      webhookData: issue_created,
    },
  });
  res.status(200).json({ success: true });
};
const onIssueUpdated = (req, res) => {
  res.status(200).json({ success: true });
};
const onIssueDeleted = (req, res) => {
  res.status(200).json({ success: true });
};
const onOtherEvents = (req, res) => {
  res.status(200).json({ success: true });
};

module.exports = {
  onIssueCreated,
  onIssueUpdated,
  onOtherEvents,
  onIssueDeleted,
};
