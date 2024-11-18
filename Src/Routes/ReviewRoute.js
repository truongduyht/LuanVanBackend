const express = require("express");
const router = express.Router();
import ReviewController from "../Controllers/ReviewController";
import uploadCloud from "../middlewares/uploadImage";

router.post("/create", ReviewController.createReview);
router.delete("/delete", ReviewController.deleteReview);
router.get("/getReviewsByFieldID", ReviewController.getReviewsByFieldID);
router.get("/readPanigationReview", ReviewController.readPanigationReview);
router.post("/updateReviewStatus", ReviewController.updateReviewStatus);

export default router;
