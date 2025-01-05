const express = require("express");
const router = express.Router();
const buddyController = require("../controllers/buddy");
const catchError = require("../config/catch");

const verifyOrganization = require("../middleware/organization");

router.post("/", verifyOrganization, catchError(buddyController.chatWithBuddy));
router.post(
  "/switch",
  verifyOrganization,
  catchError(buddyController.switchMe)
);

module.exports = router;
