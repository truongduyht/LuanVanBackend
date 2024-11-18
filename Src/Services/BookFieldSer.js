import Models from "../Models/index"; // Import mô hình User, Field, BookField
const moment = require("moment-timezone");
const mongoose = require("mongoose");
import MailSer from "../Services/MailSer";
//Update Status Booking
const updateBookingStatus = async ({ BookingID, PaymentStatus }) => {
  try {
    // Tìm đơn đặt sân dựa trên BookingID
    const updateStatus = await Models.BookField.findOne({ _id: BookingID });

    // Nếu không tìm thấy đơn đặt sân, trả về thông báo lỗi
    if (!updateStatus) {
      return {
        EM: "Không tìm thấy đơn đặt sân",
        EC: -1,
        DT: [],
      };
    }

    // Cập nhật trạng thái của đơn đặt sân
    const updatedBooking = await Models.BookField.findOneAndUpdate(
      { _id: BookingID },
      { PaymentStatus }, // Cập nhật với trạng thái truyền vào
      { new: true } // Trả về giá trị đã được cập nhật
    );
    await Models.DetailBook.updateMany(
      {
        BookingID: BookingID,
      },
      {
        Status: PaymentStatus,
      },
      { new: true }
    );

    return {
      EM: "Cập nhật trạng thái thành công",
      EC: 0,
      DT: updatedBooking, // Trả về thông tin đơn đặt sân sau khi cập nhật
    };
  } catch (error) {
    console.error("Error in updateBookingStatus:", error);
    return {
      EM: "Lỗi hệ thống khi cập nhật trạng thái đặt sân!",
      EC: -2,
      DT: [],
    };
  }
};

// Logic cho việc đặt sân và tính tiền
const createBooking = async ({
  UserID,
  FieldID,
  BookingDate,
  StartTime,
  EndTime,
}) => {
  try {
    console.log("Start", StartTime);
    console.log("End", EndTime);

    // Chuyển đổi StartTime và EndTime thành đối tượng Date theo múi giờ Việt Nam
    const StartTimeObj = moment.tz(StartTime, "Asia/Ho_Chi_Minh").toDate();
    const EndTimeObj = moment.tz(EndTime, "Asia/Ho_Chi_Minh").toDate();

    console.log("Startobj", StartTimeObj);
    console.log("Endobj", EndTimeObj);

    // Kiểm tra nếu đối tượng Date không hợp lệ
    if (isNaN(StartTimeObj.getTime()) || isNaN(EndTimeObj.getTime())) {
      return {
        EM: "Thời gian đặt sân không hợp lệ!",
        EC: -1,
        DT: [],
      };
    }

    // Kiểm tra nếu thời gian không nằm trong khoảng 8h sáng đến 10h tối
    if (StartTimeObj.getHours() < 8 || EndTimeObj.getHours() > 22) {
      return {
        EM: "Thời gian đặt sân phải từ 8h sáng đến 10h tối!",
        EC: -1,
        DT: [],
      };
    }

    // Kiểm tra xem người dùng đã đặt cùng một sân trong cùng một ngày chưa
    const existingBookingForUser = await Models.DetailBook.findOne({
      UserID,
      FieldID,
      BookingDate,
    });

    if (existingBookingForUser) {
      return {
        EM: "Bạn đã đặt sân này trong ngày hôm nay!",
        EC: -1,
        DT: [],
      };
    }

    // Kiểm tra xem sân đã có ai đặt trong khoảng thời gian này chưa
    const existingBooking = await Models.DetailBook.findOne({
      FieldID,
      BookingDate,
      StartTime: { $lt: EndTimeObj }, // StartTime trong cơ sở dữ liệu phải nhỏ hơn EndTime yêu cầu
      EndTime: { $gt: StartTimeObj }, // EndTime trong cơ sở dữ liệu phải lớn hơn StartTime yêu cầu
    });

    if (existingBooking) {
      return {
        EM: "Sân đã được đặt trong khoảng thời gian này!",
        EC: -1,
        DT: [],
      };
    }

    // Lấy thông tin sân để tính giá
    const Field = await Models.Field.findById(FieldID);
    if (!Field) {
      return {
        EM: "Không tìm thấy sân!",
        EC: -2,
        DT: [],
      };
    }

    const pricePer30Minutes = Field.Price30Minute; // Giá cho mỗi 30 phút

    // Tính số phút đặt sân
    const durationInMinutes = (EndTimeObj - StartTimeObj) / 1000 / 60;

    if (durationInMinutes <= 0) {
      return {
        EM: "Thời gian đặt sân không hợp lệ!",
        EC: -3,
        DT: [],
      };
    }

    // Tính tổng số lần 30 phút
    const total30MinuteSlots = Math.ceil(durationInMinutes / 30);

    // Tính tổng giá
    const TotalPrice = total30MinuteSlots * pricePer30Minutes;

    // Tạo mới booking với giá tiền
    const newBooking = await Models.BookField.create({
      UserID,
      PaymentStatus: "waiting",
    });

    const DataBooking = await Models.DetailBook.create({
      BookingID: newBooking._id,
      UserID,
      FieldID,
      BookingDate,
      StartTime: StartTimeObj, // Lưu thời gian bắt đầu dưới dạng Date
      EndTime: EndTimeObj, // Lưu thời gian kết thúc dưới dạng Date
      TotalPrice, // Lưu tổng giá của đơn đặt sân
      Status: "waiting",
    });

    const user = await Models.User.findOne({
      _id: UserID,
    });

    const email = user.Email;

    // Định dạng thời gian cho email
    const formattedBookingDate = moment(BookingDate)
      .tz("Asia/Ho_Chi_Minh")
      .format("DD/MM/YYYY");
    const formattedStartTime = moment(StartTimeObj)
      .tz("Asia/Ho_Chi_Minh")
      .format("HH:mm");
    const formattedEndTime = moment(EndTimeObj)
      .tz("Asia/Ho_Chi_Minh")
      .format("HH:mm");

    await MailSer.sendMail({
      email: email,
      subject: "Đặt Sân Thành Công",
      html: `
      <h1>Bạn Đã Thanh Toán Thành Công</h1>
      <h2>Dưới đây là thông tin đặt sân của bạn</h2>
      <ul>
        <li>
        Người đặt: ${user.UserName}.
        </li>
        <li>
        Sân: ${Field.FieldName}.
        </li>
        <li>Ngày nhận sân: ${formattedBookingDate}.</li>
        <li>Bắt đầu từ: ${formattedStartTime}.</li>
        <li>Đến: ${formattedEndTime}.</li>
      </ul>
      <p>Khi đến nhận sân vui lòng cho nhân viên xem thông tin để được dướng dẫn.</p>
      `,
    });
    return {
      EM: "",
      EC: 0,
      DT: DataBooking, // Trả về thông tin đơn đặt sân mới cùng giá tiền
    };
  } catch (error) {
    console.error("Error in createBooking:", error);
    return {
      EM: "Lỗi hệ thống khi đặt sân!",
      EC: -2,
      DT: [],
    };
  }
};

const cancelBooking = async (BookingID, UserID) => {
  try {
    // Tìm đơn đặt sân theo ID và UserID
    console.log(BookingID);
    console.log(UserID);

    const booking = await Models.BookField.findOne({ _id: BookingID, UserID });
    const detailbooking = await Models.DetailBook.findOne({
      BookingID: BookingID,
      UserID: UserID,
    });
    console.log("DetailBooking", detailbooking);

    // Kiểm tra xem đơn đặt sân có tồn tại hay không
    if (!booking) {
      return {
        EM: "Không tìm thấy đơn đặt sân!",
        EC: -1,
        DT: [],
      };
    }
    if (!detailbooking) {
      return {
        EM: "Không tìm thấy chi tiết đặt sân!",
        EC: -1,
        DT: [],
      };
    }

    // Lấy BookingDate từ detailbooking
    const { BookingDate } = detailbooking;

    // Kiểm tra nếu BookingDate là ngày hôm nay
    const today = new Date(); // Ngày hiện tại
    const bookingDate = new Date(BookingDate); // Chuyển đổi BookingDate thành đối tượng Date

    // So sánh ngày hiện tại với BookingDate
    if (bookingDate.toDateString() === today.toDateString()) {
      return {
        EM: "Bạn không thể hủy đơn đặt sân khi đến ngày nhận đơn!",
        EC: -2,
        DT: [],
      };
    }

    // Cập nhật trạng thái đơn đặt sân thành "Đã hủy"
    booking.PaymentStatus = "cancel";
    await booking.save();

    detailbooking.BookingDate = null;
    detailbooking.StartTime = null;
    detailbooking.EndTime = null;
    detailbooking.Status = "cancel";
    await detailbooking.save(); // Đảm bảo save() được gọi

    return {
      EM: "Hủy đơn đặt sân thành công!",
      EC: 0,
      DT: booking,
    };
  } catch (error) {
    console.error("Error in cancelBooking:", error);
    return {
      EM: "Lỗi hệ thống khi hủy đơn đặt sân!",
      EC: -3,
      DT: [],
    };
  }
};

const editBooking = async ({
  BookingID,
  BookingDate,
  StartTime,
  EndTime,
  UserID,
}) => {
  try {
    // Tìm kiếm thông tin Booking trong bảng DetailBook
    const existingDetail = await Models.DetailBook.findOne({
      BookingID: BookingID,
      UserID: UserID, // Đảm bảo rằng BookingID thuộc về UserID này
    });

    // Kiểm tra xem DetailBook có tồn tại hay không
    if (!existingDetail) {
      return {
        EM: "Không tìm thấy chi tiết đơn đặt sân!",
        EC: -1,
        DT: [],
      };
    }

    // Chuyển đổi StartTime và EndTime thành đối tượng Date theo múi giờ Việt Nam
    const StartTimeObj = moment.tz(StartTime, "Asia/Ho_Chi_Minh").toDate();
    const EndTimeObj = moment.tz(EndTime, "Asia/Ho_Chi_Minh").toDate();

    // Kiểm tra nếu đối tượng Date không hợp lệ
    if (isNaN(StartTimeObj.getTime()) || isNaN(EndTimeObj.getTime())) {
      return {
        EM: "Thời gian đặt sân không hợp lệ!",
        EC: -2,
        DT: [],
      };
    }

    // Kiểm tra nếu thời gian không nằm trong khoảng 8h sáng đến 10h tối
    if (StartTimeObj.getHours() < 8 || EndTimeObj.getHours() > 22) {
      return {
        EM: "Thời gian đặt sân phải từ 8h sáng đến 10h tối!",
        EC: -3,
        DT: [],
      };
    }

    // Kiểm tra xem có bị trùng giờ đặt không
    const conflictingBooking = await Models.DetailBook.findOne({
      FieldID: existingDetail.FieldID, // Sử dụng FieldID của chi tiết hiện tại
      BookingDate: BookingDate,
      _id: { $ne: BookingID }, // Loại bỏ chi tiết hiện tại khỏi kết quả tìm kiếm
      StartTime: { $lt: EndTimeObj }, // StartTime trong cơ sở dữ liệu phải nhỏ hơn EndTime yêu cầu
      EndTime: { $gt: StartTimeObj }, // EndTime trong cơ sở dữ liệu phải lớn hơn StartTime yêu cầu
    });

    if (conflictingBooking) {
      return {
        EM: "Sân đã được đặt trong khoảng thời gian này!",
        EC: -4,
        DT: [],
      };
    }

    // Cập nhật thông tin chi tiết đặt sân
    existingDetail.BookingDate = BookingDate;
    existingDetail.StartTime = StartTimeObj;
    existingDetail.EndTime = EndTimeObj;

    // Lưu lại chi tiết đặt sân đã chỉnh sửa
    await existingDetail.save();

    return {
      EM: "Chỉnh sửa đơn đặt sân thành công!",
      EC: 0,
      DT: existingDetail, // Trả về thông tin của đơn đặt sân đã cập nhật
    };
  } catch (error) {
    console.error("Error in editBooking:", error);
    return {
      EM: "Lỗi hệ thống khi chỉnh sửa đơn đặt sân!",
      EC: -7,
      DT: [],
    };
  }
};

const read = async (rawData) => {
  const { UserID, type, sort } = rawData;

  const sorter = {};
  if (sort?.startsWith("-")) {
    sorter[sort.substring(1)] = -1;
  } else {
    sorter[sort] = 1;
  }

  try {
    const UserOrder = await Models.BookField.find({
      UserID: UserID,
      PaymentStatus: type,
    })
      .sort(sorter)
      .lean();

    const result = UserOrder.map(async (item) => {
      let detail = await Models.DetailBook.find({
        BookingID: item._id,
      })
        .populate("FieldID")
        .lean();

      return {
        ...item,
        DetailBook: detail,
      };
    });

    const data = await Promise.all(result);

    return {
      EM: "Lấy dữ liệu thành công",
      EC: 0,
      DT: data,
    };
  } catch (error) {
    console.log(">>> error", error);
    return {
      EM: " Lỗi server",
      EC: -5,
      DT: [],
    };
  }
};

const readPagination = async (rawData) => {
  const page = parseInt(rawData.page, 10);
  const limit = parseInt(rawData.limit, 10);
  const { type, sort, BookingDate, FieldName } = rawData;

  if (!page || !limit || !type) {
    console.error("Missing required parameters: page, limit, or type.");
    return {
      EM: "Tham số không hợp lệ",
      EC: -1,
      DT: [],
    };
  }

  try {
    let offset = (page - 1) * limit;

    const sorter = {};
    if (sort?.startsWith("-")) {
      sorter[sort.substring(1)] = -1; // Sắp xếp giảm dần
    } else {
      sorter[sort] = 1; // Sắp xếp tăng dần
    }

    const queryConditions = { PaymentStatus: type };
    const detailConditions = {};
    if (BookingDate) {
      detailConditions.BookingDate = new Date(BookingDate);
    }

    // Xây dựng điều kiện tìm kiếm theo tên sân
    const fieldConditions = {};
    if (FieldName) {
      fieldConditions["FieldInfo.FieldName"] = {
        $regex: FieldName,
        $options: "i",
      }; // Tìm kiếm theo tên sân, không phân biệt hoa thường
    }

    const result = await Models.BookField.aggregate([
      {
        $lookup: {
          from: "detailbooks",
          localField: "_id",
          foreignField: "BookingID",
          as: "DetailBook",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "UserID",
          foreignField: "_id",
          as: "User", // Đổi thành User để dễ hiểu
        },
      },
      {
        $unwind: {
          path: "$User", // Chỉ lấy một người dùng từ User
          preserveNullAndEmptyArrays: true, // Giữ lại bản ghi nếu không có người dùng
        },
      },
      {
        $lookup: {
          from: "fields", // Tên bảng chứa thông tin sân
          localField: "DetailBook.FieldID", // Trường trong DetailBook
          foreignField: "_id", // Trường khóa chính trong bảng fields
          as: "FieldInfo", // Đặt tên cho trường mới
        },
      },
      {
        $unwind: {
          path: "$FieldInfo",
          preserveNullAndEmptyArrays: true, // Giữ lại bản ghi nếu không có thông tin sân
        },
      },
      {
        $match: {
          ...queryConditions,
          ...(BookingDate
            ? { "DetailBook.BookingDate": detailConditions.BookingDate }
            : {}),
          ...(FieldName ? fieldConditions : {}), // Áp dụng điều kiện tìm kiếm theo tên sân nếu có
        },
      },
      { $sort: sorter },
      { $skip: offset },
      { $limit: limit },
      {
        $project: {
          _id: 1,
          PaymentStatus: 1,
          DateBooking: 1,
          DetailBook: 1,
          FieldInfo: 1, // Đảm bảo thông tin sân được đưa vào kết quả
          "User.UserName": 1,
          "User.PhoneNumber": 1,
        },
      },
    ]);

    // Đếm tổng số bản ghi cho điều kiện lọc hiện tại
    const totalRecords = await Models.BookField.aggregate([
      {
        $lookup: {
          from: "detailbooks",
          localField: "_id",
          foreignField: "BookingID",
          as: "DetailBook",
        },
      },
      {
        $match: {
          ...queryConditions,
          ...(BookingDate
            ? { "DetailBook.BookingDate": detailConditions.BookingDate }
            : {}),
          ...(FieldName ? fieldConditions : {}), // Điều kiện đếm tổng dựa trên tên sân
        },
      },
      {
        $count: "total",
      },
    ]);

    const total = totalRecords[0]?.total || 0;

    const meta = {
      current: page,
      pageSize: limit,
      pages: Math.ceil(total / limit),
      total: total,
    };

    // Trả về kết quả
    return {
      EM: "Lấy dữ liệu thành công",
      EC: 0,
      DT: { pagination: result, meta },
    };
  } catch (error) {
    console.error(">>> error", error);
    return {
      EM: "Lỗi server",
      EC: -5,
      DT: [],
    };
  }
};

const update = async (rawData) => {
  try {
    // Kiểm tra đơn đặt có tồn tại hay không
    const existOrder = await Models.BookField.findById({
      _id: rawData.BookingID,
    });

    if (!existOrder) {
      return {
        EM: "Đơn không tồn tại !!! ",
        EC: -2,
        DT: [],
      };
    }

    // Cập nhật trạng thái đơn đặt
    const data = await Models.BookField.findByIdAndUpdate(
      { _id: rawData.BookingID },
      {
        PaymentStatus: rawData.PaymentStatus,
      },
      { new: true }
    );
    await Models.DetailBook.updateMany(
      { BookingID: rawData.BookingID },
      {
        Status: rawData.PaymentStatus, // Cập nhật Status trong DetailBook
      }
    );
    // Nếu trạng thái là "đã hủy", cập nhật lại ngày và thời gian trong DetailBook
    if (rawData.PaymentStatus === "cancel") {
      await Models.DetailBook.updateMany(
        { BookingID: rawData.BookingID },
        {
          BookingDate: null,
          StartTime: null,
          EndTime: null,
        }
      );
    }

    if (data) {
      return {
        EM: "Cập nhật trạng thái thành công!!!",
        EC: 0,
        DT: data,
      };
    }
  } catch (error) {
    console.log(">>> error", error);
    return {
      EM: "Lỗi server",
      EC: -5,
      DT: [],
    };
  }
};

const deleted = async (rawData) => {
  try {
    const exitProduct = await Models.BookField.findById(rawData.idOrder);
    if (!exitProduct) {
      return {
        EM: "Không tồn tại đơn hàng !!!",
        EC: -3,
        DT: [],
      };
    }

    // Xóa trong bảng Đặt hàng chi tiết trước
    const deleteCondition = {
      BookingID: { $in: rawData.idOrder },
    };
    const deleteItemCart = await Models.DetailBook.deleteMany(deleteCondition);

    // Xóa trong bảng đơn hàng

    const deleted = await Models.BookField.findByIdAndDelete({
      _id: rawData?.idOrder,
    });

    if (deleted) {
      return {
        EM: "Xóa đơn hàng thành công",
        EC: 0,
        DT: deleted,
      };
    }
  } catch (error) {
    console.log(">>> error", error);
    return {
      EM: " Lỗi server",
      EC: -5,
      DT: [],
    };
  }
};
const getTotalRevenue = async () => {
  try {
    const totalRevenue = await Models.DetailBook.aggregate([
      {
        // Lọc các đơn hàng đã hoàn thành
        $match: { Status: "complete" },
      },
      {
        // Tính tổng doanh thu (TotalPrice)
        $group: {
          _id: null, // Không cần nhóm theo trường nào cả
          total: { $sum: "$TotalPrice" }, // Tính tổng TotalPrice
        },
      },
    ]);
    console.log("Total Revenue Calculated:", totalRevenue[0].total);
    // Kiểm tra nếu có kết quả
    if (totalRevenue.length > 0) {
      return {
        EM: "Lấy tổng doanh thu thành công!",
        EC: 0,
        DT: totalRevenue[0].total, // Trả về tổng doanh thu
      };
    } else {
      return {
        EM: "Không có đơn hàng nào đã hoàn thành!",
        EC: 1,
        DT: 0,
      };
    }
  } catch (error) {
    console.error("Lỗi khi tính tổng doanh thu: ", error);
    return {
      EM: "Lỗi khi tính tổng doanh thu!",
      EC: -1,
      DT: 0,
    };
  }
};

const getRevenueByField = async () => {
  try {
    // Truy vấn doanh thu theo từng sân dựa trên FieldID và Status là 'completed'
    const revenueByField = await Models.DetailBook.aggregate([
      {
        // Lọc các đơn hàng đã hoàn thành (Status: "completed")
        $match: { Status: "complete" },
      },
      {
        // Nhóm theo FieldID và tính tổng TotalPrice cho từng FieldID
        $group: {
          _id: "$FieldID", // Nhóm theo FieldID
          revenueByField: { $sum: "$TotalPrice" }, // Tính tổng doanh thu (TotalPrice)
        },
      },
      {
        // Tham gia (lookup) thêm thông tin của sân từ bảng Field
        $lookup: {
          from: "fields", // Tên của collection Field
          localField: "_id", // FieldID (mã sân)
          foreignField: "_id", // Liên kết với _id của collection Field
          as: "fieldInfo", // Tên của thông tin tham chiếu (kết quả lookup sẽ lưu vào đây)
        },
      },
      {
        // Bỏ thông tin trong fieldInfo nếu không cần thiết và chỉ lấy tên sân
        $project: {
          _id: 1,
          revenueByField: 1,
          "fieldInfo.FieldName": 1, // Chỉ lấy tên sân (FieldName) từ fieldInfo
        },
      },
    ]);
    console.log("RevenueByField", revenueByField);

    // Trả về danh sách doanh thu theo từng sân
    if (revenueByField) {
      return {
        EM: "Lấy doanh thu theo từng sân thành công!!!",
        EC: 0,
        DT: revenueByField,
      };
    }
  } catch (error) {
    console.error("Lỗi khi tính doanh thu theo sân: ", error);
    return {
      EM: "Lỗi khi tính doanh thu!!!",
      EC: -1,
      DT: [],
    };
  }
};

// Hàm tính doanh thu theo ngày được truyền từ frontend
const getRevenueByDate = async (BookingDate) => {
  try {
    const startOfDay = new Date(BookingDate);
    startOfDay.setHours(0, 0, 0, 0); // Thiết lập thời gian bắt đầu của ngày

    const endOfDay = new Date(BookingDate);
    endOfDay.setHours(23, 59, 59, 999); // Thiết lập thời gian kết thúc của ngày

    // Truy vấn doanh thu dựa trên ngày đã hoàn thành (Status: "completed") trong khoảng thời gian của ngày đó
    const revenueByDate = await Models.DetailBook.aggregate([
      {
        // Lọc các đơn đặt sân đã hoàn thành và nằm trong khoảng thời gian của ngày đó
        $match: {
          Status: "complete",
          BookingDate: {
            $gte: startOfDay, // Lớn hơn hoặc bằng ngày bắt đầu
            $lte: endOfDay, // Nhỏ hơn hoặc bằng ngày kết thúc
          },
        },
      },
      {
        // Tính tổng doanh thu (TotalPrice) trong ngày
        $group: {
          _id: null, // Không cần nhóm theo field nào, chỉ cần tổng doanh thu
          totalRevenueByDate: { $sum: "$TotalPrice" }, // Tính tổng doanh thu
        },
      },
    ]);

    // Trả về doanh thu của ngày
    if (revenueByDate.length > 0) {
      return {
        EM: "Lấy doanh thu theo ngày thành công!!!",
        EC: 0,
        DT: revenueByDate[0].totalRevenueByDate, // Trả về tổng doanh thu
      };
    } else {
      return {
        EM: "Không có doanh thu trong ngày này.",
        EC: 0,
        DT: 0, // Không có doanh thu
      };
    }
  } catch (error) {
    console.error("Lỗi khi tính doanh thu theo ngày: ", error);
    return {
      EM: "Lỗi khi tính doanh thu!!!",
      EC: -1,
      DT: [],
    };
  }
};
const getRevenueByDateAndField = async (BookingDate) => {
  try {
    const startOfDay = new Date(BookingDate);
    startOfDay.setHours(0, 0, 0, 0); // Thiết lập thời gian bắt đầu của ngày

    const endOfDay = new Date(BookingDate);
    endOfDay.setHours(23, 59, 59, 999); // Thiết lập thời gian kết thúc của ngày

    // Truy vấn doanh thu theo ngày và theo từng sân (FieldID)
    const revenueByDateAndField = await Models.DetailBook.aggregate([
      {
        // Lọc các đơn hàng đã hoàn thành và nằm trong khoảng thời gian của ngày đó
        $match: {
          Status: "complete",
          BookingDate: {
            $gte: startOfDay, // Lớn hơn hoặc bằng ngày bắt đầu
            $lte: endOfDay, // Nhỏ hơn hoặc bằng ngày kết thúc
          },
        },
      },
      {
        // Nhóm theo FieldID và tính tổng TotalPrice cho từng FieldID
        $group: {
          _id: "$FieldID", // Nhóm theo FieldID (từng sân)
          revenueByDateAndField: { $sum: "$TotalPrice" }, // Tính tổng doanh thu (TotalPrice) theo từng sân
        },
      },
      {
        // Tham gia (lookup) thêm thông tin của sân từ bảng Field
        $lookup: {
          from: "fields", // Tên của collection Field
          localField: "_id", // FieldID (mã sân)
          foreignField: "_id", // Liên kết với _id của collection Field
          as: "fieldInfo", // Tên của thông tin tham chiếu (kết quả lookup sẽ lưu vào đây)
        },
      },
      {
        // Bỏ thông tin trong fieldInfo nếu không cần thiết và chỉ lấy tên sân
        $project: {
          _id: 1, // Giữ lại FieldID
          revenueByDateAndField: 1, // Tổng doanh thu
          "fieldInfo.FieldName": 1, // Chỉ lấy tên sân (FieldName) từ fieldInfo
        },
      },
    ]);
    console.log("Revenue By Date and Field", revenueByDateAndField);

    // Trả về danh sách doanh thu theo từng sân trong ngày
    if (revenueByDateAndField.length > 0) {
      return {
        EM: "Lấy doanh thu theo ngày và từng sân thành công!!!",
        EC: 0,
        DT: revenueByDateAndField,
      };
    } else {
      return {
        EM: "Không có doanh thu trong ngày này.",
        EC: 0,
        DT: [],
      };
    }
  } catch (error) {
    console.error("Lỗi khi tính doanh thu theo ngày và sân: ", error);
    return {
      EM: "Lỗi khi tính doanh thu!!!",
      EC: -1,
      DT: [],
    };
  }
};

const getTotalRevenueByMonth = async (month) => {
  try {
    // Tách tháng và năm từ chuỗi yyyy-mm
    const [Year, Month] = month.split("-").map(Number); // Tách và chuyển sang số

    // Thiết lập thời gian bắt đầu và kết thúc cho tháng
    const startOfMonth = new Date(Year, Month - 1, 1); // Tháng bắt đầu từ 0
    const endOfMonth = new Date(Year, Month, 0, 23, 59, 59, 999); // Ngày cuối cùng của tháng

    // Truy vấn tổng doanh thu theo tháng
    const revenueByMonth = await Models.DetailBook.aggregate([
      {
        // Lọc các đơn hàng đã hoàn thành và nằm trong khoảng thời gian của tháng đó
        $match: {
          Status: "complete",
          BookingDate: {
            $gte: startOfMonth, // Lớn hơn hoặc bằng ngày bắt đầu
            $lte: endOfMonth, // Nhỏ hơn hoặc bằng ngày kết thúc
          },
        },
      },
      {
        // Tính tổng doanh thu (TotalPrice) trong tháng
        $group: {
          _id: null, // Không cần nhóm theo field nào, chỉ cần tổng doanh thu
          totalRevenueByMonth: { $sum: "$TotalPrice" }, // Tính tổng doanh thu
        },
      },
    ]);

    // Trả về doanh thu của tháng
    if (revenueByMonth.length > 0) {
      return {
        EM: "Lấy doanh thu theo tháng thành công!!!",
        EC: 0,
        DT: revenueByMonth[0].totalRevenueByMonth, // Trả về tổng doanh thu
      };
    } else {
      return {
        EM: "Không có doanh thu trong tháng này.",
        EC: 0,
        DT: 0, // Không có doanh thu
      };
    }
  } catch (error) {
    console.error("Lỗi khi tính doanh thu theo tháng: ", error);
    return {
      EM: "Lỗi khi tính doanh thu!!!",
      EC: -1,
      DT: [],
    };
  }
};

const getRevenueByMonthAndField = async (month) => {
  try {
    // Tách tháng và năm từ chuỗi yyyy-mm
    const [Year, Month] = month.split("-").map(Number); // Tách và chuyển sang số

    // Thiết lập thời gian bắt đầu và kết thúc cho tháng
    const startOfMonth = new Date(Year, Month - 1, 1); // Tháng bắt đầu từ 0
    const endOfMonth = new Date(Year, Month, 0, 23, 59, 59, 999); // Ngày cuối cùng của tháng

    // Truy vấn doanh thu theo tháng và theo từng sân (FieldID)
    const revenueByMonthAndField = await Models.DetailBook.aggregate([
      {
        // Lọc các đơn hàng đã hoàn thành và nằm trong khoảng thời gian của tháng đó
        $match: {
          Status: "complete",
          BookingDate: {
            $gte: startOfMonth, // Lớn hơn hoặc bằng ngày bắt đầu
            $lte: endOfMonth, // Nhỏ hơn hoặc bằng ngày kết thúc
          },
        },
      },
      {
        // Nhóm theo FieldID và tính tổng TotalPrice cho từng FieldID
        $group: {
          _id: "$FieldID", // Nhóm theo FieldID (từng sân)
          revenueByMonthAndField: { $sum: "$TotalPrice" }, // Tính tổng doanh thu (TotalPrice) theo từng sân
        },
      },
      {
        // Tham gia (lookup) thêm thông tin của sân từ bảng Field
        $lookup: {
          from: "fields", // Tên của collection Field
          localField: "_id", // FieldID (mã sân)
          foreignField: "_id", // Liên kết với _id của collection Field
          as: "fieldInfo", // Tên của thông tin tham chiếu (kết quả lookup sẽ lưu vào đây)
        },
      },
      {
        // Bỏ thông tin trong fieldInfo nếu không cần thiết và chỉ lấy tên sân
        $project: {
          _id: 1, // Giữ lại FieldID
          revenueByMonthAndField: 1, // Tổng doanh thu
          "fieldInfo.FieldName": 1, // Chỉ lấy tên sân (FieldName) từ fieldInfo
        },
      },
    ]);
    console.log("Revenue By Month and Field", revenueByMonthAndField);

    // Trả về danh sách doanh thu theo từng sân trong tháng
    if (revenueByMonthAndField.length > 0) {
      return {
        EM: "Lấy doanh thu theo tháng và từng sân thành công!!!",
        EC: 0,
        DT: revenueByMonthAndField,
      };
    } else {
      return {
        EM: "Không có doanh thu trong tháng này.",
        EC: 0,
        DT: [],
      };
    }
  } catch (error) {
    console.error("Lỗi khi tính doanh thu theo tháng và sân: ", error);
    return {
      EM: "Lỗi khi tính doanh thu!!!",
      EC: -1,
      DT: [],
    };
  }
};
const statistic = async (UserID) => {
  console.log("DataID", UserID);

  try {
    // Chuyển đổi UserID thành ObjectId nếu cần thiết (nếu UserID là chuỗi)
    const userObjectId = new mongoose.Types.ObjectId(UserID);

    // Đếm số lượng đơn đã đặt, đã nhận và đã hủy theo UserID và trạng thái thanh toán
    const countBooked = await Models.BookField.countDocuments({
      UserID: userObjectId,
      PaymentStatus: "success", // trạng thái đã đặt
    });

    const countReceived = await Models.BookField.countDocuments({
      UserID: userObjectId,
      PaymentStatus: "complete", // trạng thái đã nhận
    });

    const countCanceled = await Models.BookField.countDocuments({
      UserID: userObjectId,
      PaymentStatus: "cancel", // trạng thái đã hủy
    });

    console.log("Data", countBooked, countReceived, countCanceled);

    // Trả về kết quả thống kê
    return {
      EM: "Lấy dữ liệu thống kê thành công",
      EC: 0,
      DT: {
        booked: countBooked,
        received: countReceived,
        canceled: countCanceled,
      },
    };
  } catch (error) {
    console.log(">>> error", error);
    return {
      EM: "Lỗi server",
      EC: -5,
      DT: [],
    };
  }
};

export default {
  createBooking,
  cancelBooking,
  read,
  readPagination,
  update,
  deleted,
  editBooking,
  getRevenueByField,
  getRevenueByDate,
  getRevenueByDateAndField,
  getTotalRevenue,
  updateBookingStatus,
  getTotalRevenueByMonth,
  getRevenueByMonthAndField,
  statistic,
};
