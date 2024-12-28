const express = require("express");
const router = express.Router();
const roleController = require("../controllers/role");
const catchError = require("../config/catch");

router.get("/", catchError(roleController.listAllRoles));
router.get("/:id", catchError(roleController.getRoleDetails));
router.post("/", catchError(roleController.createRole));

module.exports = router;
