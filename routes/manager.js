const express = require("express");
const router = express.Router();
const managerController = require("../controllers/manager");
const catchError = require("../config/catch");
const verifyOrganization = require("../middleware/organization");

router.get("/", verifyOrganization, catchError(managerController.listManagers));
router.get("/:id", catchError(managerController.getManagerDetails));
router.post("/", catchError(managerController.createManager));

router.post("/login", catchError(managerController.loginManager));

module.exports = router;
