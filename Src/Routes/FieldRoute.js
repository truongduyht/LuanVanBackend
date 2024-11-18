const express = require("express");
const router = express.Router();
import FieldController from "../Controllers/FieldController";
import uploadCloud from "../middlewares/uploadImage";

router.post("/create", uploadCloud.single("IMGField"), FieldController.create);
router.post("/update", uploadCloud.single("IMGField"), FieldController.update);
router.post("/updateFieldStatus", FieldController.updateFieldStatus);
router.delete("/delete", FieldController.delete);
router.get("/readField", FieldController.readField);
router.get("/readPanigate", FieldController.readPanigate);
router.get("/getAvailableTimeSlots", FieldController.getAvailableTimeSlots);
router.get("/getAllField", FieldController.getAllField);
router.get(
  "/getFieldsWithAvailableSlots",
  FieldController.getFieldsWithAvailableSlotsController
);
export default router;
