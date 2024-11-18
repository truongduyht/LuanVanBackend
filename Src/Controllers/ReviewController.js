import Review from "../Services/ReviewSer";

class FieldController {
  // Phương thức tạo đánh giá
  async createReview(req, res) {
    try {
      const { UserID, FieldID, Rating, Comment } = req.body;
      // Kiểm tra dữ liệu đầu vào
      if (!UserID || !FieldID || !Rating || Rating < 1 || Rating > 5) {
        return {
          EM: "Dữ liệu đánh giá không hợp lệ! Vui lòng nhập đủ thông tin và rating phải từ 1 đến 5.",
          EC: -1,
          DT: [],
        };
      }
      const dataReview = {
        UserID: UserID,
        FieldID: FieldID,
        Rating: Rating,
        Comment: Comment,
      };
      // Gọi service để tạo đánh giá
      const result = await Review.createReview(dataReview);

      // Kiểm tra kết quả và trả về phản hồi
      if (result.EC === 0) {
        return res.status(200).json({
          EM: result.EM,
          EC: result.EC,
          DT: result.DT, // Trả về thông tin đánh giá đã tạo
        });
      } else {
        return res.status(400).json({
          EM: result.EM,
          EC: result.EC,
          DT: [], // Trả về thông tin rỗng nếu thất bại
        });
      }
    } catch (error) {
      console.error("Error in createReview:", error);
      return res.status(500).json({
        EM: "Lỗi hệ thống khi tạo đánh giá!",
        EC: -2,
        DT: [],
      });
    }
  }
  async updateReviewStatus(req, res) {
    try {
      const { id, Status } = req.body;

      // Kiểm tra dữ liệu đầu vào
      if (!id || !Status) {
        return res.status(400).json({
          EM: "Dữ liệu không hợp lệ! Vui lòng nhập đầy đủ ReviewID và trạng thái mới.",
          EC: -1,
          DT: [],
        });
      }

      // Gọi service để cập nhật trạng thái đánh giá
      const result = await Review.updateReviewStatus(id, Status);

      // Kiểm tra kết quả và trả về phản hồi
      if (result.EC === 0) {
        return res.status(200).json({
          EM: result.EM,
          EC: result.EC,
          DT: result.DT, // Trả về thông tin đánh giá đã cập nhật
        });
      } else {
        return res.status(400).json({
          EM: result.EM,
          EC: result.EC,
          DT: [], // Trả về thông tin rỗng nếu thất bại
        });
      }
    } catch (error) {
      console.error("Error in updateReviewStatus:", error);
      return res.status(500).json({
        EM: "Lỗi hệ thống khi cập nhật trạng thái đánh giá!",
        EC: -2,
        DT: [],
      });
    }
  }
  // Phương thức xóa đánh giá
  deleteReview = async (req, res) => {
    const id = req.body;
    if (!id) {
      return res.json({
        EM: "Không tìm thấy đánh giá!!! ",
        EC: -2,
        DT: [],
      });
    }
    try {
      const data = await Review.deleteReview(req.body);
      return res.json({
        EM: data.EM,
        EC: data.EC,
        DT: data.DT,
      });
    } catch (error) {}
  };
  // Phương thức lấy tất cả đánh giá của sân
  async getReviewsByFieldID(req, res) {
    try {
      const { id } = req.query; // Nhận FieldID từ query params
      console.log("Id Field", req.query);

      if (!id) {
        return res.status(400).json({
          EM: "FieldID không hợp lệ hoặc không tồn tại.",
          EC: -1,
          DT: [],
        });
      }

      // Gọi service để lấy danh sách đánh giá
      const result = await Review.getReviewsByFieldID(req.query);

      // Trả kết quả
      if (result.EC === 0) {
        return res.status(200).json({
          EM: result.EM,
          EC: result.EC,
          DT: result.DT, // Trả về danh sách đánh giá
        });
      } else {
        return res.status(400).json({
          EM: result.EM,
          EC: result.EC,
          DT: [], // Trả về thông tin rỗng nếu thất bại
        });
      }
    } catch (error) {
      console.error("Error in getReviewsByFieldID:", error);
      return res.status(500).json({
        EM: "Lỗi hệ thống khi lấy đánh giá!",
        EC: -2,
        DT: [],
      });
    }
  }
  async readPanigationReview(req, res) {
    try {
      // Nhận dữ liệu từ request body
      const rawData = req.query;
      console.log("Request Data:", rawData);

      // Gọi service để lấy danh sách đánh giá với phân trang
      const data = await Review.readPanigationReview(req.query);
      console.log("Review", data.DT.pagination);

      // Trả kết quả

      return res.status(200).json({
        EM: data.EM,
        EC: data.EC,
        DT: data.DT,
      });
    } catch (error) {
      console.error("Error in getPaginationReview:", error);
      return res.status(500).json({
        EM: "Lỗi hệ thống khi lấy danh sách đánh giá!",
        EC: -2,
        DT: [],
      });
    }
  }
}

export default new FieldController();
