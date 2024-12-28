const onIssueCreated = (req, res) => {
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
