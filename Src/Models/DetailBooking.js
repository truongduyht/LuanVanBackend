import mongoose from "mongoose";
const { Schema } = mongoose;

const DetailBookSchema = new Schema(
  {
    BookingID: { type: mongoose.Types.ObjectId, ref: "Book" },
    UserID: { type: mongoose.Types.ObjectId, ref: "User" },
    FieldID: { type: mongoose.Types.ObjectId, ref: "Field" },
    BookingDate: Date,
    StartTime: Date,
    EndTime: Date,
    TotalPrice: Number,
    Status: String,
  },
  {
    timestamps: true,
  }
);
const DetailBook = mongoose.model("DetailBook", DetailBookSchema);

export default DetailBook;
