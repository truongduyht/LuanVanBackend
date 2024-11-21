import Models from "../Models/index";
import moment from "moment";
const exitFieldByType = async (FieldType) => {
  const field = await Models.Field.findOne({
    FieldType: FieldType,
  });
  if (field) {
    return true;
  } else {
    return false;
  }
};

const exitFieldByName = async (FieldName) => {
  const field = await Models.Field.findOne({
    FieldName: FieldName,
  });
  if (field) {
    return true;
  } else {
    return false;
  }
};

const exitFieldById = async (id) => {
  const field = await Models.Field.findById(id);
  if (field) {
    return true;
  } else {
    return false;
  }
};

const getFieldById = async (id) => {
  const field = await Models.Field.findOne({
    _id: id,
  });
  return field;
};

const getFieldByType = async (FieldType) => {
  const field = await Models.Field.findOne({
    FieldType: FieldType,
  });
  return field;
};

const create = async (rawData, IMGField) => {
  console.log("------------", rawData);
  try {
    const existField = await exitFieldByName(rawData?.FieldName);
    if (existField) {
      return {
        EM: "Tên sân đã tồn tại !!! ",
        EC: -2,
        DT: [],
      };
    }

    const data = await Models.Field.create({
      FieldName: rawData.FieldName,
      FieldType: rawData.FieldType,
      Price30Minute: rawData.Price30Minute,
      Status: "ok",
      IMGField: IMGField,
    });

    if (data) {
      return {
        EM: "Thêm sân thành công ",
        EC: 0,
        DT: data,
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

const update = async (id, rawData, IMGField) => {
  console.log("------------", rawData);
  try {
    const existField = await Models.Field.findById(id);
    if (!existField) {
      return {
        EM: "Sân không tồn tại !!! ",
        EC: -2,
        DT: [],
      };
    }

    // Cập nhật dữ liệu
    existField.FieldName = rawData.FieldName || existField.FieldName;
    existField.FieldType = rawData.FieldType || existField.FieldType;
    existField.Price30Minute =
      rawData.Price30Minute || existField.Price30Minute;

    // Nếu có ảnh mới, cập nhật ảnh
    if (IMGField) {
      existField.IMGField = IMGField;
    }

    // Lưu thay đổi vào database
    const data = await existField.save();

    return {
      EM: "Cập nhật sân thành công",
      EC: 0,
      DT: data,
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
const updateFieldStatus = async (id, status) => {
  try {
    // Tìm sân theo ID
    const existField = await Models.Field.findById(id);
    if (!existField) {
      return {
        EM: "Sân không tồn tại !!!",
        EC: -2,
        DT: [],
      };
    }

    // Cập nhật trạng thái của sân
    existField.Status = status || existField.Status;

    // Lưu thay đổi vào database
    const data = await existField.save();

    return {
      EM: "Cập nhật trạng thái sân thành công",
      EC: 0,
      DT: data,
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

const getFieldWithPagination = async (rawData) => {
  const { page, limit, sort, type, BookingDate, StartTime, EndTime } = rawData;
  console.log("Data Filter", rawData);

  try {
    // Khởi tạo điều kiện tìm kiếm và sắp xếp
    let offset = (+page - 1) * limit;
    const filter = {};
    const sorter = {};

    // Xử lý sắp xếp
    if (sort?.startsWith("-")) {
      sorter[sort.substring(1)] = -1;
    } else {
      sorter[sort] = 1;
    }

    // Xử lý lọc theo loại sân
    if (type) {
      filter.FieldType = type;
    }

    // Nếu không có ngày và thời gian, trả về tất cả sân
    if (!BookingDate || !StartTime || !EndTime) {
      const pagination = await Models.Field.find(filter)
        .skip(offset)
        .limit(limit)
        .sort(sorter)
        .exec();

      const totalRecords = await Models.Field.countDocuments(filter);

      const meta = {
        current: page,
        pageSize: limit,
        pages: Math.ceil(totalRecords / limit),
        total: totalRecords,
      };

      return {
        EM: "Lấy dữ liệu thành công",
        EC: 0,
        DT: { pagination, meta },
      };
    }

    // Nếu có ngày và thời gian, tiến hành lọc theo DetailBook
    const startOfDay = new Date(BookingDate);
    const endOfDay = new Date(BookingDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Chuyển đổi StartTime và EndTime thành đối tượng Date
    const start = moment(StartTime, "HH:mm").toDate();
    const end = moment(EndTime, "HH:mm").toDate();

    // Tìm các DetailBook không khả dụng trong khoảng thời gian này
    const unavailableDetails = await Models.DetailBook.find({
      BookingDate: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
      $or: [
        {
          StartTime: { $lt: end }, // Nếu thời gian bắt đầu nhỏ hơn thời gian kết thúc được chọn
        },
        {
          EndTime: { $gt: start }, // Nếu thời gian kết thúc lớn hơn thời gian bắt đầu được chọn
        },
      ],
    }).populate("FieldID"); // Populate để lấy thông tin sân tương ứng

    // Lấy tất cả FieldID không khả dụng
    const unavailableFieldIds = unavailableDetails.map(
      (detail) => detail.FieldID
    );

    // Lọc các sân không có trong danh sách FieldID không khả dụng
    filter._id = { $nin: unavailableFieldIds };

    // Truy vấn các sân trống
    const pagination = await Models.Field.find(filter)
      .skip(offset)
      .limit(limit)
      .sort(sorter)
      .exec();

    const totalRecords = await Models.Field.countDocuments(filter);

    const meta = {
      current: page,
      pageSize: limit,
      pages: Math.ceil(totalRecords / limit),
      total: totalRecords,
    };

    return {
      EM: "Lấy dữ liệu thành công",
      EC: 0,
      DT: { pagination, meta, BookingDate, StartTime, EndTime },
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

const readField = async (rawData) => {
  try {
    console.log(rawData);
    const exitProduct = await exitFieldById(rawData.id);
    if (!exitProduct) {
      return {
        EM: "Sân không tồn tại !!!",
        EC: -3,
        DT: [],
      };
    }
    const field = await getFieldById(rawData.id);
    if (field) {
      return {
        EM: "Lấy sân thành công",
        EC: 0,
        DT: field,
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

const deleted = async (rawData) => {
  try {
    const exitProduct = await exitFieldById(rawData.id);
    if (!exitProduct) {
      return {
        EM: "Không tồn tại sân này !!!",
        EC: -3,
        DT: [],
      };
    }

    const deleted = await Models.Field.findByIdAndDelete({
      _id: rawData?.id,
    });

    if (deleted) {
      return {
        EM: "Xóa sân thành công",
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
const getAvailableSlots = (BookingDate, bookedSlots, openTime, closeTime) => {
  let availableSlots = [];
  let currentSlot = moment(`${BookingDate} ${openTime}`, "YYYY-MM-DD HH:mm");
  const endOfDay = moment(`${BookingDate} ${closeTime}`, "YYYY-MM-DD HH:mm");

  // Nếu không có slot đã đặt, trả về toàn bộ khoảng thời gian
  if (bookedSlots.length === 0) {
    availableSlots.push({
      StartTime: currentSlot.format("HH:mm"),
      EndTime: endOfDay.format("HH:mm"),
    });
    return availableSlots;
  }

  // Sắp xếp các khung giờ đã đặt theo thời gian bắt đầu
  bookedSlots.sort((a, b) => a.StartTime - b.StartTime);

  // Lấy khung giờ trống trước khung giờ đã đặt đầu tiên
  if (currentSlot.isBefore(bookedSlots[0].StartTime)) {
    console.log(bookedSlots[0].StartTime);
    availableSlots.push({
      StartTime: currentSlot.format("HH:mm"),
      EndTime: bookedSlots[0].StartTime.format("HH:mm"),
    });
  }

  console.log("Lấy khung giờ trống trước khung giờ đã đặt đầu tiên");

  // Lặp qua tất cả các khung giờ đã đặt để kiểm tra các khoảng trống

  if (bookedSlots.length > 1) {
    for (var i = 0; i < bookedSlots.length - 1; i++) {
      const currentEnd = bookedSlots[i]?.EndTime;
      const nextStart = bookedSlots[i + 1]?.StartTime;

      // if (currentEnd.isBefore(nextStart)) {
      availableSlots.push({
        StartTime: currentEnd?.format("HH:mm"),
        EndTime: nextStart?.format("HH:mm"),
      });
      // }
    }
  }

  // Lấy khung giờ trống sau khung giờ đã đặt cuối cùng
  const lastEndTime = bookedSlots[bookedSlots.length - 1].EndTime;

  if (lastEndTime.isBefore(endOfDay) && !lastEndTime.isSame(endOfDay)) {
    availableSlots.push({
      StartTime: lastEndTime.format("HH:mm"),
      EndTime: endOfDay.format("HH:mm"),
    });
  }

  console.log("cúi time >>", availableSlots);

  return availableSlots;
};

// Hàm lấy khung giờ trống theo ngày và sân
const getAvailableTimeSlots = async (rawData) => {
  const {
    BookingDate,
    FieldID,
    openTime = "08:00",
    closeTime = "22:00",
    intervalMinutes = 30,
  } = rawData;

  try {
    // Kiểm tra sân có tồn tại hay không
    const field = await Models.Field.findById(FieldID);
    if (!field) {
      return {
        EM: "Sân không tồn tại!",
        EC: -2,
        DT: [],
      };
    }

    // Lấy các giờ đã được đặt cho sân trong ngày được chọn
    const startOfDay = new Date(BookingDate);
    const endOfDay = new Date(BookingDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Lấy các giờ đã đặt cho sân trong ngày
    const bookedSlots = await Models.DetailBook.find({
      FieldID: FieldID,
      BookingDate: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
      Status: { $ne: "cancel" }, // Chỉ lấy đơn đặt không bị hủy
    }).select("StartTime EndTime");

    // Lấy các giờ đã hủy cho sân trong ngày được chọn
    const cancelledSlots = await Models.DetailBook.find({
      FieldID: FieldID,
      BookingDate: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
      Status: "cancel", // Chỉ lấy đơn hủy
    }).select("StartTime EndTime");

    // Chuyển các giờ đã đặt sang định dạng moment
    const formattedBookedSlots = bookedSlots.map((slot) => ({
      StartTime: moment(slot.StartTime),
      EndTime: moment(slot.EndTime),
    }));

    // Chuyển các giờ đã hủy sang định dạng moment
    const formattedCancelledSlots = cancelledSlots.map((slot) => ({
      StartTime: moment(slot.StartTime),
      EndTime: moment(slot.EndTime),
    }));

    // Kết hợp khung giờ đã đặt và khung giờ đã hủy vào danh sách khung giờ đã đặt
    const combinedSlots = formattedBookedSlots.concat(formattedCancelledSlots);
    console.log("Com", combinedSlots);

    // Tính toán các khung giờ trống, bao gồm cả các đơn đã hủy
    const availableSlots = getAvailableSlots(
      BookingDate,
      combinedSlots,
      openTime,
      closeTime
    );

    return {
      EM: "Lấy giờ trống thành công",
      EC: 0,
      DT: availableSlots,
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

const getFieldsWithAvailableSlots = async (rawData) => {
  const { BookingDate } = rawData;
  const openTime = "08:00";
  const closeTime = "22:00";
  try {
    // Lấy danh sách tất cả các sân
    const fields = await Models.Field.find({}); // Bạn có thể thêm các điều kiện nếu cần
    console.log("Field", fields);

    // Kiểm tra nếu không có sân nào
    if (fields.length === 0) {
      return {
        EM: "Không có sân nào!",
        EC: -1,
        DT: [],
      };
    }

    const results = [];

    // Xử lý từng sân để tìm khoảng thời gian trống
    for (const field of fields) {
      // Xác định khoảng thời gian cho ngày đặt sân
      const startOfDay = moment(BookingDate).startOf("day");
      const endOfDay = moment(BookingDate).endOf("day");

      // Lấy các giờ đã được đặt cho sân trong ngày đã chọn
      const bookedSlots = await Models.DetailBook.find({
        FieldID: field._id,
        BookingDate: {
          $gte: startOfDay.toDate(),
          $lte: endOfDay.toDate(),
        },
        Status: { $ne: "da_huy" }, // Chỉ lấy đơn đặt không bị hủy
      }).select("StartTime EndTime");

      // Chuyển các giờ đã đặt sang định dạng moment
      const formattedBookedSlots = bookedSlots.map((slot) => ({
        StartTime: moment(slot.StartTime),
        EndTime: moment(slot.EndTime),
      }));

      // Tính toán các khung giờ trống cho từng sân
      const availableSlots = getAvailableSlots(
        BookingDate,
        formattedBookedSlots,
        openTime,
        closeTime
      );

      // Lưu trữ kết quả cho sân này
      results.push({
        FieldID: field._id,
        FieldName: field.FieldName,
        FieldType: field.FieldType,
        Price30Minute: field.Price30Minute,
        AvailableSlots: availableSlots,
      });
    }

    return {
      EM: "Lấy giờ trống thành công",
      EC: 0,
      DT: results,
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
  create,
  getFieldWithPagination,
  readField,
  update,
  updateFieldStatus,
  deleted,
  getAvailableTimeSlots,
  getFieldsWithAvailableSlots,
};
