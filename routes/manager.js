const express = require("express");
const router = express.Router();
const managerController = require("../controllers/manager");
const catchError = require("../config/catch");

router.get("/", catchError(managerController.listManagers));
router.get("/:id", catchError(managerController.getManagerDetails));
router.post("/", catchError(managerController.createManager));

module.exports = router;
