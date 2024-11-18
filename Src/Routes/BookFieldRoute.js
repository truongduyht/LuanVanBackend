const express = require("express");
const router = express.Router();
import BookingController from "../Controllers/BookFieldController";

router.post("/createBooking", BookingController.createBooking);
router.get("/read", BookingController.read);
router.get("/readPanigation", BookingController.readPanigation);
router.put("/cancelBooking", BookingController.cancelBooking);
router.put("/editBooking", BookingController.editBooking);
router.put("/updateStatus", BookingController.update);
router.get("/getBookingsByDate", BookingController.getBookingsByDate);
router.get("/getTotalRevenue", BookingController.getTotalRevenue);
router.get("/getRevenueByField", BookingController.getRevenueByField);
router.get("/getRevenueByDate", BookingController.getRevenueByDate);
router.get(
  "/getRevenueByDateAndField",
  BookingController.getRevenueByDateAndField
);
router.get("/getTotalRevenueByMonth", BookingController.getTotalRevenueByMonth);
router.get(
  "/getRevenueByMonthAndField",
  BookingController.getRevenueByMonthAndField
);
router.get("/statistic", BookingController.statistic);

export default router;
