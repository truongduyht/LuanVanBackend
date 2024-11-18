import mongoose from "mongoose";
const { Schema } = mongoose;

const FieldSchema = new Schema(
  {
    FieldName: String,
    FieldType: String,
    Price30Minute: Number,
    Status: String,
    IMGField: String,
  },
  {
    timestamps: true,
  }
);
const Field = mongoose.model("Field", FieldSchema);

export default Field;
