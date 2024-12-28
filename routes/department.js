const express = require("express");
const router = express.Router();
const departmentController = require("../controllers/department");
const catchError = require("../config/catch");
const verifyOrganization = require("../middleware/organization");

router.get("/", catchError(departmentController.listAllDepartments));
router.get(
  "/:id",
  verifyOrganization,
  catchError(departmentController.getDepartmentDetails)
);
router.post("/", catchError(departmentController.createDepartment));

router.put("/", departmentController.addEmployeeToDepartment);

module.exports = router;
