const express = require("express");
const router = express.Router();
const employeeController = require("../controllers/employee");
const catchError = require("../config/catch");

const verifyOrganization = require("../middleware/organization");

router.get(
  "/",
  verifyOrganization,
  catchError(employeeController.listEmployees)
);
router.get(
  "/:id",
  verifyOrganization,
  catchError(employeeController.getEmployeeDetails)
);
router.post("/status", verifyOrganization,catchError(employeeController.getEmployeeStatus));
router.post(
  "/",
  verifyOrganization,
  catchError(employeeController.createEmployee)
);
router.post("/login", catchError(employeeController.loginEmployee));
router.put("/:id", employeeController.updateEmployee);

module.exports = router;
