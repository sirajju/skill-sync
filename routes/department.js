const express = require("express");
const router = express.Router();
const departmentController = require("../controllers/department");
const catchError = require("../config/catch");

router.get("/", catchError(departmentController.listAllDepartments));
router.get("/:id", catchError(departmentController.getDepartmentDetails));
router.post("/", catchError(departmentController.createDepartment));

module.exports = router;
