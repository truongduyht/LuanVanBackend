const moment = require("moment");
import BookFieldSer from "../Services/BookFieldSer.js";
const config = require("../Config/default.json");

function sortObject(obj) {
  let sorted = {};
  let str = [];
  let key;
  for (key in obj) {
    if (obj.hasOwnProperty(key)) {
      str.push(encodeURIComponent(key));
    }
  }
  str.sort();
  for (key = 0; key < str.length; key++) {
    sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
  }
  return sorted;
}

class PaymentController {
  //[POST] /payment/vnpay/create_payment_url
  async createPaymentVnpayUrl(req, res) {
    try {
      const dataBooking = req.body; // Lấy dữ liệu booking từ body request
      console.log("DataBooking", dataBooking);

      if (!dataBooking) {
        return res.status(400).json({
          statusCode: 400,
          msg: "Thông tin booking không hợp lệ",
        });
      }

      let date = new Date();
      let createDate = moment(date).format("YYYYMMDDHHmmss");

      let ipAddr = req.headers["x-forwarded-for"];
      req.connection.remoteAddress;
      req.socket.remoteAddress || req.connection.socket.remoteAddress;

      let tmnCode = config.vnp_TmnCode;
      let secretKey = config.vnp_HashSecret;
      let vnpUrl = config.vnp_Url;
      let returnUrl = config.vnp_ReturnUrl;
      let orderId = moment(date).format("DDHHmmss");

      let locale = "vn";
      let currCode = "VND";
      let vnp_Params = {};

      vnp_Params["vnp_Version"] = "2.1.0";
      vnp_Params["vnp_Command"] = "pay";
      vnp_Params["vnp_TmnCode"] = tmnCode;
      vnp_Params["vnp_Locale"] = locale;
      vnp_Params["vnp_CurrCode"] = currCode;
      vnp_Params["vnp_TxnRef"] = dataBooking.BookingID;
      vnp_Params["vnp_OrderInfo"] =
        "Thanh toán đặt sân: " + dataBooking.BookingID;
      vnp_Params["vnp_OrderType"] = "Thanh toan VNPAY";
      vnp_Params["vnp_Amount"] = dataBooking.TotalPrice * 100; // Tổng giá trị booking
      vnp_Params["vnp_ReturnUrl"] = returnUrl;
      vnp_Params["vnp_IpAddr"] = ipAddr;
      vnp_Params["vnp_CreateDate"] = createDate;

      vnp_Params = sortObject(vnp_Params);
      console.log(vnp_Params);
      let querystring = require("qs");
      let signData = querystring.stringify(vnp_Params, { encode: false });
      let crypto = require("crypto");
      let hmac = crypto.createHmac("sha512", secretKey);
      let signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");
      vnp_Params["vnp_SecureHash"] = signed;
      vnpUrl += "?" + querystring.stringify(vnp_Params, { encode: false });

      return res.status(200).json({
        statusCode: 200,
        msg: "Tạo liên kết thanh toán thành công",
        data: {
          url: vnpUrl,
        },
      });
    } catch (error) {
      console.log("err>>>", error);

      return res.status(500).json({
        statusCode: 500,
        msg: "Có lỗi xảy ra",
        error: error.message,
      });
    }
  }

  //[GET] /payment/vnpay/return
  async vnpayReturn(req, res) {
    try {
      console.log("req >>", req);

      let querystring = require("qs");
      let crypto = require("crypto");

      var vnp_Params = req.query;
      var secureHash = vnp_Params["vnp_SecureHash"];

      delete vnp_Params["vnp_SecureHash"];
      delete vnp_Params["vnp_SecureHashType"];

      vnp_Params = sortObject(vnp_Params);

      var secretKey = config.vnp_HashSecret;
      // var secretKey = "4DY2B692PVWIRR1CXH3TESKUNB5M0EWZ";

      var signData = querystring.stringify(vnp_Params, { encode: false });
      var hmac = crypto.createHmac("sha512", secretKey);
      var signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

      var orderId = vnp_Params["vnp_TxnRef"];
      var rspCode = vnp_Params["vnp_ResponseCode"];

      if (secureHash === signed) {
        if (rspCode == "00") {
          // Thanh toán thành công
          const updateBooking = await BookFieldSer.updateBookingStatus({
            BookingID: orderId,
            PaymentStatus: "waiting", // Cập nhật trạng thái thành "SUCCESS","
          });
          if (updateBooking) {
            return res.status(200).json({
              statusCode: updateBooking.statusCode,
              msg: "Đơn hàng đã được xác nhận",
              data: updateBooking,
            });
          } else {
            return res.status(404).json({
              statusCode: 404,
              msg: "Không tìm thấy đơn hàng",
            });
          }
        } else {
          // Giao dịch không thành công
          const updateBooking = await BookFieldSer.updateBookingStatus({
            PaymentStatus: "cancel", // Cập nhật trạng thái "Cancelled"
            BookingID: orderId,
          });

          return res.status(400).json({
            statusCode: 400,
            msg: "Giao dịch không thành công",
            data: updateBooking,
          });
        }
      } else {
        return res.status(500).json({
          statusCode: 500,
          msg: "Lỗi xác thực",
        });
      }
    } catch (error) {
      return res.status(500).json({
        statusCode: 500,
        msg: "Có lỗi xảy ra",
        error: error.message,
      });
    }
  }

  //[GET] /payment/vnpay/ipn
  async vnpayIpn(req, res) {
    try {
      var vnp_Params = req.query;
      var secureHash = vnp_Params["vnp_SecureHash"];

      delete vnp_Params["vnp_SecureHash"];
      delete vnp_Params["vnp_SecureHashType"];

      vnp_Params = sortObject(vnp_Params);

      var config = require("config");
      var secretKey = config.get("vnp_HashSecret");
      var querystring = require("qs");
      var signData = querystring.stringify(vnp_Params, { encode: false });
      var crypto = require("crypto");
      var hmac = crypto.createHmac("sha512", secretKey);
      var signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

      if (secureHash === signed) {
        var orderId = vnp_Params["vnp_TxnRef"];
        var rspCode = vnp_Params["vnp_ResponseCode"];

        if (rspCode === "00") {
          // Cập nhật trạng thái booking khi thanh toán thành công
          await BookFieldSer.updateBookingStatus({
            PaymentStatus: "waiting",
            BookingID: orderId,
          });
          res.status(200).json({ RspCode: "00", Message: "waiting" });
        } else {
          res
            .status(200)
            .json({ RspCode: "01", Message: "Transaction failed" });
        }
      } else {
        res.status(200).json({ RspCode: "97", Message: "Checksum failed" });
      }
    } catch (error) {
      return res.status(500).json({
        statusCode: 500,
        msg: "Có lỗi xảy ra",
        error: error.message,
      });
    }
  }
}
export default new PaymentController();
