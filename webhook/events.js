const { getPrismaClient } = require("../config/prisma");
const { issue_created } = require("./JIRA");
const Prisma = getPrismaClient();

const onIssueCreated = (req, res) => {
  const data = {
    createdAt:new Date(issue_created.timestamp)
  }
  res.status(200).json({ success: true });
};
const onIssueUpdated = (req, res) => {
  res.status(200).json({ success: true });
};
const onOtherEvents = (req, res) => {
  res.status(200).json({ success: true });
};

module.exports = {
  onIssueCreated,
  onIssueUpdated,
  onOtherEvents,
};
