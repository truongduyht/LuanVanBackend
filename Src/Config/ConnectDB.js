import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect("mongodb://127.0.0.1:27017/FootBall", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connect success ");
  } catch (error) {
    console.log("error", error);
    console.log("Connect fail !!! ");
  }
};

export default { connectDB };
