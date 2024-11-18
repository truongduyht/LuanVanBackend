require("dotenv").config();
import nodemailer from "nodemailer";

const sendMail = async ({ email, subject, html }) => {
  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
  console.log(email);

  const message = {
    from: "FOOTBALL",
    to: email,
    subject: subject,
    html: html,
  };

  const result = await transporter.sendMail(message);
  console.log(result);

  return result;
};

export default { sendMail };
