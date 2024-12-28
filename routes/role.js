const express = require("express");
const router = express.Router();
const roleController = require("../controllers/role");
const catchError = require("../config/catch");

const verifyOrganization = require("../middleware/organization");

router.get("/", verifyOrganization, catchError(roleController.listAllRoles));
router.get(
  "/:id",
  verifyOrganization,
  catchError(roleController.getRoleDetails)
);
router.post("/", verifyOrganization, catchError(roleController.createRole));

module.exports = router;
