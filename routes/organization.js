const express = require("express");
const router = express.Router();
const organizationController = require("../controllers/organization");
const catchError = require("../config/catch");
const verifyOrganization = require("../middleware/organization");

const { JiraClient } = require("../clients/jira");
const { getPrismaClient } = require("../config/prisma");

const Prisma = getPrismaClient();

router.post(
  "/test",
  verifyOrganization,
  catchError(async (req, res) => {
    const { cloudId } = req.body;
    

    res.json({ data: projects });
  })
);

router.get(
  "/",
  verifyOrganization,
  catchError(organizationController.listAllOrganization)
);
router.get(
  "/",
  verifyOrganization,
  catchError(organizationController.getOrgDetails)
);
router.post("/", catchError(organizationController.createOrganization));

module.exports = router;
