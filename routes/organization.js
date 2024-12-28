const express = require("express");
const router = express.Router();
const organizationController = require("../controllers/organization");
const catchError = require("../config/catch");

router.get("/", catchError(organizationController.listAllOrganization));
router.get("/:id", catchError(organizationController.getOrgDetails));
router.post("/", catchError(organizationController.createOrganization));

module.exports = router;
