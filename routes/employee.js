const express = require("express");
const router = express.Router();
const employeeController = require("../controllers/employee");
const catchError = require("../config/catch");

router.get("/", catchError(employeeController.listEmployees));
router.get("/:id", catchError(employeeController.getEmployeeDetails));
router.post("/", catchError(employeeController.createEmployee));

router.put("/:id", employeeController.updateEmployee);

module.exports = router;
