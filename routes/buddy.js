const express = require("express");
const router = express.Router();
const buddyController = require("../controllers/buddy");
const catchError = require("../config/catch");

const verifyOrganization = require("../middleware/organization");

router.use("/", verifyOrganization, catchError(buddyController.chatWithBuddy));

module.exports = router;
