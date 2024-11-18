import express from "express";
import morgan from "morgan";
import cors from "cors";
import cookieParser from "cookie-parser";
import "dotenv/config";
const bodyParser = require("body-parser");

import route from "./Routes/index";

const app = express();
const port = process.env.PORT || 8888;
const hostname = process.env.HOST_NAME;
import db from "./Config/ConnectDB.js";

app.use(bodyParser.json());

// Thư viên morgan
app.use(morgan("combined"));

// Cookie-parse
app.use(cookieParser());

// chia sẻ tài nguyên
const corsOptions = {
  origin: "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  credentials: true,
};

app.use(cors(corsOptions));

// Xử lí req.body from data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect databse
db.connectDB();

route(app);

app.listen(port, hostname, () => {
  console.log(`Example app listening on port ${port}`);
});
