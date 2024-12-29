const express = require("express");
const router = express.Router();
const catchError = require("../config/catch");

const {
  JiraClient,
  getAuthorizationUrl,
  verifyToken,
  authenticate,
} = require("../clients/jira");

router.get("/cloud-id", verifyToken, catchError(JiraClient.getCloudId));
router.get("/login", getAuthorizationUrl);
router.get("/authenticate", authenticate);

module.exports = router;
