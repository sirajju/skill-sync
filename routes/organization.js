const express = require("express");
const router = express.Router();
const organizationController = require("../controllers/organization");
const catchError = require("../config/catch");
const verifyOrganization = require("../middleware/organization");

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
