import BookFieldSer from "../Services/BookFieldSer";

class BookingController {
  // [POST] /api/booking/createBooking
  async createBooking(req, res) {
    try {
      console.log("Data createBooking", req.body);

      const { UserID, FieldID, BookingDate, StartTime, EndTime } = req.body;

      // Kiểm tra đầu vào
      if (!UserID || !FieldID || !BookingDate || !StartTime || !EndTime) {
        return res.status(400).json({
          EM: "Nhập thiếu thông tin đặt sân!",
          EC: -1,
          DT: [],
        });
      }

      // Gọi service để xử lý logic đặt sân và tính tiền
      const result = await BookFieldSer.createBooking({
        UserID,
        FieldID,
        BookingDate,
        StartTime,
        EndTime,
      });

      // Kiểm tra kết quả từ service
      if (result.EC === 0) {
        return res.status(200).json({
          EM: "",
          EC: 0,
          DT: result.DT, // Trả về thông tin đơn đặt sân và giá tiền
        });
      } else {
        return res.status(400).json({
          EM: result.EM,
          EC: result.EC,
          DT: [],
        });
      }
    } catch (error) {
      console.error("Error in createBooking:", error);
      return res.status(500).json({
        EM: "Lỗi hệ thống! Vui lòng thử lại sau.",
        EC: -2,
        DT: [],
      });
    }
  }
  async cancelBooking(req, res) {
    try {
      const { BookingID, UserID } = req.body; // ID của lịch đặt sân
      // ID người dùng từ token sau khi đăng nhập

      if (!BookingID) {
        return res.status(400).json({
          EM: "Thiếu thông tin đặt sân.",
          EC: -1,
          DT: [],
        });
      }

      const result = await BookFieldSer.cancelBooking(BookingID, UserID);

      return res.status(200).json({
        EM: result.EM,
        EC: result.EC,
        DT: result.DT,
      });
    } catch (error) {
      console.error("Error in cancelFieldBooking:", error);
      return res.status(500).json({
        EM: "Lỗi hệ thống!",
        EC: -2,
        DT: [],
      });
    }
  }

  // Controller để xử lý yêu cầu chỉnh sửa đơn đặt sân
  async editBooking(req, res) {
    try {
      console.log("Data editBooking:", req.body); // In ra dữ liệu nhận từ request

      const { BookingID, UserID, BookingDate, StartTime, EndTime } = req.body;

      // Kiểm tra các tham số đầu vào
      if (!BookingID || !UserID || !BookingDate || !StartTime || !EndTime) {
        return res.status(400).json({
          EM: "Nhập thiếu thông tin chỉnh sửa đơn đặt sân!", // Thông báo lỗi nếu thiếu dữ liệu
          EC: -1,
          DT: [],
        });
      }

      // Gọi hàm trong service để xử lý logic chỉnh sửa đơn đặt sân
      const result = await BookFieldSer.editBooking({
        BookingID,
        UserID,
        BookingDate,
        StartTime,
        EndTime,
      });

      // Kiểm tra kết quả trả về từ service và trả về tương ứng
      if (result.EC === 0) {
        return res.status(200).json({
          EM: "Chỉnh sửa đơn đặt sân thành công!",
          EC: 0,
          DT: result.DT, // Trả về thông tin đơn đặt sân đã chỉnh sửa
        });
      } else {
        return res.status(400).json({
          EM: result.EM,
          EC: result.EC,
          DT: [], // Trả về lỗi nếu có vấn đề trong xử lý
        });
      }
    } catch (error) {
      console.error("Error in editBooking:", error); // Log lỗi hệ thống để debug
      return res.status(500).json({
        EM: "Lỗi hệ thống! Vui lòng thử lại sau.", // Trả về lỗi 500 nếu xảy ra lỗi không mong muốn
        EC: -2,
        DT: [],
      });
    }
  }

  async readPanigation(req, res) {
    try {
      let sort = req.query.sort;
      let type = req.query.type;
      let BookingDate = req.query.BookingDate;
      let FieldName = req.query.FieldName;
      console.log("Controller BookingDate", BookingDate);
      console.log("Controller FieldName", FieldName);

      let data = await BookFieldSer.readPagination(req.query);

      return res.status(200).json({
        EM: data.EM,
        EC: data.EC,
        DT: data.DT,
      });
    } catch (err) {
      console.log("err <<< ", err);
      return res.status(500).json({
        EM: "error server", // error message
        EC: "-1", // error code
        DT: "", // data
      });
    }
  }

  // [GET ] /api/order/read

  async read(req, res) {
    let sort = req.query.sort;
    let type = req.query.type;
    let UserID = req.query.UserID;

    if (!UserID) {
      return res.json({
        EM: "Không có người dùng!!! ",
        EC: -2,
        DT: [],
      });
    }

    const data = await BookFieldSer.read(req.query);
    if (data) {
      return res.json({
        EM: data.EM,
        EC: data.EC,
        DT: data.DT,
      });
    }
  }

  async update(req, res) {
    try {
      console.log("data update status booking", req.body);

      const { BookingID, PaymentStatus } = req.body;

      if (!BookingID || !PaymentStatus) {
        return res.status(200).json({
          EM: "Nhập thiếu trường dữ liệu !!!",
          EC: -2,
          DT: [],
        });
      }

      try {
        const data = await BookFieldSer.update(req.body);
        return res.status(200).json({
          EM: data.EM,
          EC: data.EC,
          DT: data.DT,
        });
      } catch (error) {
        console.log(">>> error", error);
      }
    } catch (error) {
      console.log("error", error);
    }
  }

  // [DELETE] /api/order/delete
  async delete(req, res) {
    const { BookingID } = req.body;
    if (!BookingID) {
      return res.json({
        EM: "Nhập thiếu trường dữ liệu !!! ",
        EC: -2,
        DT: [],
      });
    }
    try {
      const data = await BookFieldSer.deleted(req.body);
      return res.json({
        EM: data.EM,
        EC: data.EC,
        DT: data.DT,
      });
    } catch (error) {
      console.log(">>> error", error);
    }
  }

  async revenue(req, res) {
    try {
      const data = await BookFieldSer.revenueProduct();
      return res.json({
        EM: data.EM,
        EC: data.EC,
        DT: data.DT,
      });
    } catch (error) {
      console.log(">>> error", error);
    }
  }

  //[GET] /api/booking/getBookingsByDate
  async getBookingsByDate(req, res) {
    try {
      // Lấy BookingDate từ query params hoặc body (tùy cách truyền từ frontend)
      const BookingDate = req.query.BookingDate || req.body.BookingDate;

      // Kiểm tra nếu không có BookingDate trong request
      if (!BookingDate) {
        return res.status(400).json({
          EM: "Vui lòng cung cấp ngày đặt sân (BookingDate).", // Error Message
          EC: -1, // Error Code
          DT: null, // Data (empty)
        });
      }

      // Gọi service để lấy dữ liệu
      const data = await BookFieldSer.getBookingsByDate(BookingDate);

      // Trả về response với dữ liệu từ service
      return res.status(200).json({
        EM: data.EM, // Message từ service
        EC: data.EC, // Error Code từ service (0 nếu thành công)
        DT: data.DT, // Data (nếu thành công)
      });
    } catch (err) {
      console.log("Error at getBookingsByDate controller:", err);

      // Xử lý lỗi server
      return res.status(500).json({
        EM: "Lỗi server khi lấy dữ liệu đơn đặt sân", // Error Message
        EC: -1, // Error Code
        DT: null, // Data (empty)
      });
    }
  }
  async getRevenueByDateAndField(req, res) {
    try {
      // Lấy BookingDate từ query params hoặc body (tùy cách truyền từ frontend)
      const { BookingDate } = req.query;
      console.log("DateAndField", BookingDate);

      // Kiểm tra nếu không có BookingDate trong request
      if (!BookingDate) {
        return res.status(400).json({
          EM: "Vui lòng cung cấp ngày cần tính doanh thu.", // Error Message
          EC: -1, // Error Code
          DT: null, // Data (empty)
        });
      }

      // Gọi service để lấy dữ liệu
      const data = await BookFieldSer.getRevenueByDateAndField(BookingDate);

      // Trả về response với dữ liệu từ service
      return res.status(200).json({
        EM: data.EM, // Message từ service
        EC: data.EC, // Error Code từ service (0 nếu thành công)
        DT: data.DT, // Data (nếu thành công)
      });
    } catch (err) {
      console.log("Error at getBookingsByDate controller:", err);

      // Xử lý lỗi server
      return res.status(500).json({
        EM: "Lỗi server", // Error Message
        EC: -1, // Error Code
        DT: null, // Data (empty)
      });
    }
  }
  async getRevenueByDate(req, res) {
    try {
      // Lấy BookingDate từ query params hoặc body (tùy cách truyền từ frontend)
      const { BookingDate } = req.query;

      console.log("Bookingbydate", BookingDate);
      // Kiểm tra nếu không có BookingDate trong request
      if (!BookingDate) {
        return res.status(400).json({
          EM: "Vui lòng cung cấp ngày cần tính.", // Error Message
          EC: -1, // Error Code
          DT: null, // Data (empty)
        });
      }

      // Gọi service để lấy dữ liệu
      const data = await BookFieldSer.getRevenueByDate(BookingDate);

      // Trả về response với dữ liệu từ service
      return res.status(200).json({
        EM: data.EM, // Message từ service
        EC: data.EC, // Error Code từ service (0 nếu thành công)
        DT: data.DT, // Data (nếu thành công)
      });
    } catch (err) {
      console.log("Error at getBookingsByDate controller:", err);

      // Xử lý lỗi server
      return res.status(500).json({
        EM: "Lỗi server", // Error Message
        EC: -1, // Error Code
        DT: null, // Data (empty)
      });
    }
  }
  async getTotalRevenue(req, res) {
    try {
      const data = await BookFieldSer.getTotalRevenue();
      return res.json({
        EM: data.EM,
        EC: data.EC,
        DT: data.DT,
      });
    } catch (error) {
      console.log(">>> error", error);
    }
  }
  async getRevenueByField(req, res) {
    try {
      const data = await BookFieldSer.getRevenueByField();
      return res.json({
        EM: data.EM,
        EC: data.EC,
        DT: data.DT,
      });
    } catch (error) {
      console.log(">>> error", error);
    }
  }
  async getTotalRevenueByMonth(req, res) {
    try {
      // Lấy month và year từ query params
      const { month } = req.query;

      console.log("RevenueByMonth", month);

      // Kiểm tra nếu không có month hoặc year trong request
      if (!month) {
        return res.status(400).json({
          EM: "Vui lòng cung cấp tháng và năm cần tính doanh thu.", // Thông báo lỗi
          EC: -1, // Mã lỗi
          DT: null, // Dữ liệu (trống)
        });
      }

      // Gọi service để lấy doanh thu theo tháng
      const data = await BookFieldSer.getTotalRevenueByMonth(month);

      // Trả về response với dữ liệu từ service
      return res.status(200).json({
        EM: data.EM, // Thông báo từ service
        EC: data.EC, // Mã lỗi từ service (0 nếu thành công)
        DT: data.DT, // Dữ liệu (nếu thành công)
      });
    } catch (err) {
      console.log("Error at getRevenueByMonth controller:", err);

      // Xử lý lỗi server
      return res.status(500).json({
        EM: "Lỗi server", // Thông báo lỗi
        EC: -1, // Mã lỗi
        DT: null, // Dữ liệu (trống)
      });
    }
  }

  async getRevenueByMonthAndField(req, res) {
    try {
      // Lấy Month từ query params
      const { month, year } = req.query;

      console.log("RevenueByMonthAndField", month);

      // Kiểm tra nếu không có month trong request
      if (!month) {
        return res.status(400).json({
          EM: "Vui lòng cung cấp tháng cần tính doanh thu.", // Thông báo lỗi
          EC: -1, // Mã lỗi
          DT: null, // Dữ liệu (trống)
        });
      }

      // Gọi service để lấy doanh thu theo tháng và theo từng sân
      const data = await BookFieldSer.getRevenueByMonthAndField(month, year);

      // Trả về response với dữ liệu từ service
      return res.status(200).json({
        EM: data.EM, // Thông báo từ service
        EC: data.EC, // Mã lỗi từ service (0 nếu thành công)
        DT: data.DT, // Dữ liệu (nếu thành công)
      });
    } catch (err) {
      console.log("Error at getRevenueByMonthAndField controller:", err);

      // Xử lý lỗi server
      return res.status(500).json({
        EM: "Lỗi server", // Thông báo lỗi
        EC: -1, // Mã lỗi
        DT: null, // Dữ liệu (trống)
      });
    }
  }
  async statistic(req, res) {
    const { UserID } = req.query;
    console.log("UserID", UserID);

    // Kiểm tra xem có UserID không
    if (!UserID) {
      return res.json({
        EM: "Không có người dùng!!!",
        EC: -2,
        DT: [],
      });
    }

    // Gọi service thống kê
    const data = await BookFieldSer.statistic(UserID);

    // Trả về kết quả
    if (data) {
      return res.json({
        EM: data.EM,
        EC: data.EC,
        DT: data.DT,
      });
    } else {
      return res.json({
        EM: "Lỗi không xác định!",
        EC: -1,
        DT: [],
      });
    }
  }
}

export default new BookingController();
