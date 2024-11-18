import FieldSer from "../Services/FieldSer";
import Models from "../Models";

class FieldController {
  //[Post]api/field/create
  create = async (req, res) => {
    console.log("Field", req.body);
    const { FieldName, Price30Minute, FieldType } = req.body;

    const dataBody = {
      FieldName: FieldName,
      Price30Minute: +Price30Minute,
      FieldType: FieldType,
    };

    const IMGField = req?.file?.path;

    if (!IMGField) {
      return res.json({
        EM: "Upload hình lỗi , không có hình !!! ",
        EC: -2,
        DT: [],
      });
    }

    if (!FieldName || !Price30Minute || !FieldType) {
      return res.json({
        EM: "Nhập thiếu trường dữ liệu !!! ",
        EC: -2,
        DT: [],
      });
    }
    try {
      const data = await FieldSer.create(dataBody, IMGField);
      return res.json({
        EM: data.EM,
        EC: data.EC,
        DT: data.DT,
      });
    } catch (error) {
      console.log(">>> error", error);
    }
  };

  //[Post]/api/field/update
  update = async (req, res) => {
    console.log("Field", req.body);
    const { FieldName, Price30Minute, FieldType, id } = req.body;

    const dataBody = {
      FieldName: FieldName,
      Price30Minute: +Price30Minute,
      FieldType: FieldType,
    };

    const IMGField = req?.file?.path;

    if (!id) {
      return res.json({
        EM: "Thiếu ID sân bóng !!!",
        EC: -1,
        DT: [],
      });
    }

    try {
      const data = await FieldSer.update(id, dataBody, IMGField);
      return res.json({
        EM: data.EM,
        EC: data.EC,
        DT: data.DT,
      });
    } catch (error) {
      console.log(">>> error", error);
      return res.json({
        EM: "Lỗi server",
        EC: -5,
        DT: [],
      });
    }
  };
  updateFieldStatus = async (req, res) => {
    console.log("Update Status", req.body);

    // Lấy id và status từ body của request
    const { id, Status } = req.body;

    // Kiểm tra nếu thiếu ID hoặc status
    if (!id) {
      return res.json({
        EM: "Thiếu ID sân bóng !!!",
        EC: -1,
        DT: [],
      });
    }

    if (!Status) {
      return res.json({
        EM: "Thiếu trạng thái của sân !!!",
        EC: -1,
        DT: [],
      });
    }

    try {
      // Gọi service để cập nhật trạng thái sân
      const data = await FieldSer.updateFieldStatus(id, Status);

      return res.json({
        EM: data.EM, // Trả về thông báo từ service
        EC: data.EC, // Mã lỗi
        DT: data.DT, // Dữ liệu trả về
      });
    } catch (error) {
      console.log(">>> error", error);
      return res.json({
        EM: "Lỗi server",
        EC: -5,
        DT: [],
      });
    }
  };

  //[Delete]/api/field/delete
  delete = async (req, res) => {
    const id = req.body;
    if (!id) {
      return res.json({
        EM: "Không tìm thấy sân!!! ",
        EC: -2,
        DT: [],
      });
    }
    try {
      const data = await FieldSer.deleted(req.body);
      return res.json({
        EM: data.EM,
        EC: data.EC,
        DT: data.DT,
      });
    } catch (error) {}
  };

  // [Get] /api/field/readPanigate
  readPanigate = async (req, res) => {
    try {
      // Lấy các tham số từ query string
      let page = +req.query.page;
      let limit = +req.query.limit;
      let sort = req.query.sort;
      let type = req.query.type;
      let BookingDate = req.query.BookingDate; // Thêm tham số ngày
      let StartTime = req.query.StartTime; // Thêm tham số thời gian bắt đầu
      let EndTime = req.query.EndTime; // Thêm tham số thời gian kết thúc

      // Gọi hàm service để lấy dữ liệu với phân trang và lọc
      let data = await FieldSer.getFieldWithPagination({
        page,
        limit,
        sort,
        type,
        BookingDate, // Chuyển tham số ngày
        StartTime, // Chuyển tham số thời gian bắt đầu
        EndTime, // Chuyển tham số thời gian kết thúc
      });

      // Trả về dữ liệu cho client
      return res.status(200).json({
        EM: data.EM,
        EC: data.EC,
        DT: data.DT,
      });
    } catch (err) {
      console.log("err <<< ", err);
      return res.status(500).json({
        EM: "error server", // thông báo lỗi
        EC: "-1", // mã lỗi
        DT: "", // dữ liệu
      });
    }
  };

  // [Get] /api/field/read
  readField = async (req, res) => {
    const { id } = req.query;

    if (!id) {
      return res.json({
        EM: "Không có id sân !!!!",
        EC: -1,
        DT: [],
      });
    }

    try {
      const data = await FieldSer.readField(req.query);
      return res.json({
        EM: data.EM,
        EC: data.EC,
        DT: data.DT,
      });
    } catch (error) {
      console.log(">>> error", error);
    }
  };
  // [Get] /api/field/available-times
  getAvailableTimeSlots = async (req, res) => {
    try {
      const { BookingDate, FieldID } = req.query;
      console.log("Data TimeSlot", req.query);

      if (!BookingDate || !FieldID) {
        return res.json({
          EM: "Thiếu thông tin ngày đặt hoặc mã sân!!!",
          EC: -1,
          DT: [],
        });
      }

      const data = await FieldSer.getAvailableTimeSlots({
        BookingDate,
        FieldID,
      });

      return res.status(200).json({
        EM: data.EM,
        EC: data.EC,
        DT: data.DT,
      });
    } catch (error) {
      console.log("error >>>", error);
      return res.status(500).json({
        EM: "Lỗi server",
        EC: -1,
        DT: [],
      });
    }
  };
  getAllField = async (req, res) => {
    try {
      // Lấy tất cả các sân từ cơ sở dữ liệu
      const fields = await Models.Field.find();

      // Nếu không tìm thấy sân nào, trả về thông báo tương ứng
      if (!fields || fields.length === 0) {
        return res.status(404).json({
          EC: 1, // Error code cho biết không tìm thấy dữ liệu
          EM: "Không có sân nào được tìm thấy",
          DT: [],
        });
      }

      // Nếu có dữ liệu, trả về danh sách các sân
      return res.status(200).json({
        EC: 0, // Error code cho biết thành công
        EM: "Lấy danh sách sân thành công",
        DT: fields, // Dữ liệu là danh sách các sân
      });
    } catch (error) {
      // Xử lý nếu có lỗi trong quá trình truy vấn
      console.error("Lỗi khi lấy danh sách sân:", error);
      return res.status(500).json({
        EC: 1, // Error code cho biết lỗi hệ thống
        EM: "Lỗi hệ thống khi lấy danh sách sân",
        DT: [],
      });
    }
  };
  getFieldsWithAvailableSlotsController = async (req, res) => {
    try {
      // Lấy các tham số từ query string
      const { BookingDate } = req.query;

      // Kiểm tra nếu thiếu các tham số cần thiết
      if (!BookingDate) {
        return res.status(400).json({
          EM: "Thiếu tham số BookingDate",
          EC: -1,
          DT: [],
        });
      }

      // Gọi hàm dịch vụ để lấy dữ liệu danh sách sân và thời gian trống
      let data = await FieldSer.getFieldsWithAvailableSlots({
        BookingDate, // Ngày đặt sân
      });

      // Trả về dữ liệu cho client
      return res.status(200).json({
        EM: data.EM,
        EC: data.EC,
        DT: data.DT,
      });
    } catch (err) {
      console.error(
        ">>> Error in getFieldsWithAvailableSlots controller: ",
        err
      );
      return res.status(500).json({
        EM: "Lỗi server", // Thông báo lỗi server
        EC: -5, // Mã lỗi server
        DT: [], // Dữ liệu rỗng
      });
    }
  };
}

export default new FieldController();
