import mongoose from "mongoose";
const { Schema } = mongoose;

const UserSchema = new Schema(
  {
    UserName: String,
    Password: String,
    PhoneNumber: String,
    Email: String,
    Role: String,
  },
  {
    timestamps: true,
  }
);
const User = mongoose.model("User", UserSchema);

export default User;
