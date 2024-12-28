const express = require("express");
const router = express.Router();
const departmentController = require("../controllers/department");
const catchError = require("../config/catch");
const verifyOrganization = require("../middleware/organization");

router.get(
  "/",
  catchError(departmentController.listAllDepartments)
);
router.get(
  "/:id",
  verifyOrganization,
  catchError(departmentController.getDepartmentDetails)
);
router.post(
  "/",
  catchError(departmentController.createDepartment)
);

module.exports = router;
