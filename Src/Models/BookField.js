import mongoose from "mongoose";
const { Schema } = mongoose;

const BookSchema = new Schema(
  {
    UserID: { type: mongoose.Types.ObjectId, ref: "User" },
    DateBooking: { type: Date, default: Date.now },
    PaymentStatus: String,
  },
  {
    timestamps: true,
  }
);
const Book = mongoose.model("Book", BookSchema);

export default Book;
