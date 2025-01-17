const express = require("express");
const router = express.Router();
const assesmentsController = require("../controllers/assesments");
const catchError = require("../config/catch");

const verifyOrganization = require("../middleware/organization");

router.get(
  "/",
  verifyOrganization,
  catchError(assesmentsController.listAllAssesments)
);
router.get(
  "/:id",
  verifyOrganization,
  catchError(assesmentsController.getAssessmentDetails)
);
router.get(
  "/role/:roleId",
  verifyOrganization,
  catchError(assesmentsController.getAssesmentByRole)
);
router.put(
  "/:id",
  verifyOrganization,
  catchError(assesmentsController.updateAssesment)
);
router.post(
  "/",
  verifyOrganization,
  catchError(assesmentsController.createAssesment)
);

module.exports = router;
