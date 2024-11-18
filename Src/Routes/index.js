import User from "./UserRoute";
import Field from "./FieldRoute";
import Booking from "./BookFieldRoute";
import PayMent from "./PaymentRoute";
import Review from "./ReviewRoute";

function route(app) {
  app.use("/api/user", User);
  app.use("/api/field", Field);
  app.use("/api/booking", Booking);
  app.use("/api/payment", PayMent);
  app.use("/api/review", Review);
}

export default route;
