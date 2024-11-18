import mongoose from "mongoose";
const { Schema } = mongoose;

const ReviewSchema = new Schema(
  {
    UserID: { type: mongoose.Types.ObjectId, ref: "User" },
    FieldID: { type: mongoose.Types.ObjectId, ref: "Field" },
    Rating: Number,
    Comment: String,
    Status: String,
  },
  {
    timestamps: true,
  }
);
const Review = mongoose.model("Review", ReviewSchema);

export default Review;
