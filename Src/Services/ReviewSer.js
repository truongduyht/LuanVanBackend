import Models from "../Models";

const createReview = async (dataReview) => {
  try {
    const { UserID, FieldID } = dataReview;

    // Kiểm tra xem người dùng đã đánh giá sân này chưa
    const existingReview = await Models.Review.findOne({ UserID, FieldID });

    if (existingReview) {
      return {
        EM: "Người dùng đã đánh giá sân này, không thể đánh giá lại!",
        EC: 1,
        DT: existingReview, // Trả về thông tin đánh giá cũ nếu muốn
      };
    }

    // Nếu người dùng chưa đánh giá, tiến hành tạo đánh giá mới
    const newReview = await Models.Review.create({
      UserID: dataReview.UserID,
      FieldID: dataReview.FieldID,
      Rating: dataReview.Rating,
      Comment: dataReview.Comment || "", // Comment là tùy chọn
      Status: "good",
      CreatedAt: new Date(), // Thời gian tạo đánh giá
    });

    return {
      EM: "Đánh giá thành công!",
      EC: 0,
      DT: newReview, // Trả về thông tin đánh giá vừa tạo
    };
  } catch (error) {
    console.error("Error in createReview:", error);
    return {
      EM: "Lỗi hệ thống khi tạo đánh giá!",
      EC: -2,
      DT: [],
    };
  }
};
const updateReviewStatus = async (id, Status) => {
  try {
    // Tìm đánh giá dựa trên ID
    const review = await Models.Review.findById(id);

    // Kiểm tra xem đánh giá có tồn tại không
    if (!review) {
      return {
        EM: "Đánh giá không tồn tại!",
        EC: 1,
        DT: null,
      };
    }

    // Cập nhật trạng thái mới cho đánh giá
    review.Status = Status;

    // Lưu thay đổi vào cơ sở dữ liệu
    await review.save();

    return {
      EM: "Cập nhật trạng thái đánh giá thành công!",
      EC: 0,
      DT: review, // Trả về thông tin đánh giá sau khi cập nhật
    };
  } catch (error) {
    console.error("Error in updateReviewStatus:", error);
    return {
      EM: "Lỗi hệ thống khi cập nhật trạng thái đánh giá!",
      EC: -2,
      DT: null,
    };
  }
};
const deleteReview = async (rawData) => {
  try {
    const exitReview = await Models.Review.findOne({ _id: rawData?.id });
    if (!exitReview) {
      return {
        EM: "Không tồn tại đánh giá này !!!",
        EC: -3,
        DT: [],
      };
    }
    const deleted = await Models.Review.findByIdAndDelete({
      _id: rawData?.id,
    });

    if (deleted) {
      return {
        EM: "Xóa đánh giá thành công",
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
const getReviewsByFieldID = async (rawData) => {
  try {
    // Kiểm tra nếu không có FieldID được truyền vào
    if (!rawData.id) {
      return {
        EM: "Thiếu ID của sân bóng.",
        EC: 1,
        DT: [],
      };
    }

    // Truy vấn lấy tất cả các đánh giá của sân dựa trên FieldID
    const reviews = await Models.Review.find({ FieldID: rawData.id })
      .populate("UserID", "UserName") // Lấy tên người dùng liên quan tới UserID
      .sort({ CreatedAt: -1 }); // Sắp xếp các đánh giá từ mới đến cũ

    // Kiểm tra xem có đánh giá nào không
    if (reviews.length === 0) {
      return {
        EM: "Không có đánh giá nào cho sân này.",
        EC: 0,
        DT: [],
      };
    }

    // Trả về danh sách các đánh giá
    return {
      EM: "Lấy danh sách đánh giá thành công.",
      EC: 0,
      DT: reviews,
    };
  } catch (error) {
    console.error("Error in getReviewsByFieldID:", error);
    return {
      EM: "Lỗi hệ thống khi lấy danh sách đánh giá!",
      EC: -2,
      DT: [],
    };
  }
};
const readPanigationReview = async (rawData) => {
  const page = parseInt(rawData.page, 10);
  const limit = parseInt(rawData.limit, 10);
  const { sort, FieldName, createdAt } = rawData;

  // Kiểm tra xem các tham số page và limit có hợp lệ không
  if (!page || !limit) {
    console.error("Missing required parameters: page or limit.");
    return {
      EM: "Tham số không hợp lệ",
      EC: -1,
      DT: [],
    };
  }

  try {
    let offset = (page - 1) * limit;

    // Xây dựng điều kiện sắp xếp
    const sorter = {};
    if (sort?.startsWith("-")) {
      sorter[sort.substring(1)] = -1; // Sắp xếp giảm dần
    } else {
      sorter[sort] = 1; // Sắp xếp tăng dần
    }

    // Điều kiện tìm kiếm
    const queryConditions = {};

    // Kiểm tra và thêm điều kiện tìm kiếm theo tên sân
    if (FieldName) {
      // Tìm kiếm theo tên sân trong mô hình Field
      const fields = await Models.Field.find({
        FieldName: { $regex: FieldName, $options: "i" }, // Tìm kiếm không phân biệt hoa thường
      }).select("_id"); // Chọn chỉ ID của các sân phù hợp

      // Thêm điều kiện vào query
      if (fields.length > 0) {
        queryConditions["FieldID"] = { $in: fields.map((field) => field._id) }; // Lọc theo danh sách ID sân tìm được
      } else {
        // Nếu không tìm thấy sân nào thì trả về không có kết quả
        return {
          EM: "Không tìm thấy sân nào",
          EC: 0,
          DT: [],
        };
      }
    }

    // Kiểm tra và xử lý điều kiện tìm kiếm theo ngày
    if (createdAt) {
      const startDate = new Date(createdAt); // Ngày bắt đầu
      const endDate = new Date(startDate); // Khởi tạo ngày kết thúc từ ngày bắt đầu
      endDate.setDate(endDate.getDate() + 1); // Thêm một ngày để bao gồm cả ngày đã cho

      // Thêm điều kiện vào query
      queryConditions["createdAt"] = {
        $gte: startDate, // Ngày lớn hơn hoặc bằng
        $lt: endDate, // Ngày nhỏ hơn (không bao gồm ngày kế tiếp)
      };
    }

    // Nếu không có FieldName và createdAt, không cần điều kiện nào khác
    // Truy vấn để lấy danh sách đánh giá
    const result = await Models.Review.find(queryConditions)
      .sort(sorter)
      .skip(offset)
      .limit(limit)
      .populate("UserID", "UserName PhoneNumber") // Lấy thông tin người dùng từ UserID
      .populate("FieldID", "FieldName") // Lấy thông tin tên sân từ FieldID
      .lean(); // Chuyển đổi kết quả thành đối tượng đơn giản hơn

    // Đếm tổng số bản ghi cho điều kiện lọc hiện tại
    const total = await Models.Review.countDocuments(queryConditions);

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

export default {
  createReview,
  updateReviewStatus,
  deleteReview,
  getReviewsByFieldID,
  readPanigationReview,
};
