import jwt from "jsonwebtoken";
import { TokenExpiredError } from "jsonwebtoken";
import UserSer from "../Services/UserSer";
import MailSer from "../Services/MailSer";

class UserController {
  // [POST] /api/user/register
  async register(req, res) {
    try {
      const { UserName, PhoneNumber, Password, Email } = req.body;

      // Validate
      if (!UserName || !PhoneNumber || !Password || !Email) {
        return res.status(400).json({
          EM: "Nhập thiếu dữ liệu !!!",
          EC: "-1",
          DT: "",
        });
      }

      // Create User
      let data = await UserSer.registerNewUser(req.body);

      if (data.EC === 0) {
        // Kiểm tra xem quá trình tạo tài khoản có thành công không
        // Gửi mail chào mừng nếu tạo tài khoản thành công
        try {
          await MailSer.sendMail({
            email: Email,
            subject: "CHÚC MỪNG BẠN ĐÃ ĐĂNG KÝ TÀI KHOẢN THÀNH CÔNG",
            html: `
            <h1>Chào mừng bạn đến với website của chúng tôi</h1>
            <ul>
              <li>
              Tài khoản: ${UserName}
              </li> 
            </ul>
            <p>Cảm ơn bạn đã đăng ký. Vui lòng bảo mật thông tin tài khoản của bạn.</p>
            `,
          });
        } catch (emailError) {
          console.error("Lỗi khi gửi email:", emailError);
          return res.status(500).json({
            EM: "Đăng ký thành công nhưng không thể gửi email xác nhận.",
            EC: "-3",
            DT: "",
          });
        }
      }

      return res.status(200).json({
        EM: data.EM, // Message từ kết quả của việc tạo user
        EC: data.EC, // Error code từ kết quả tạo user
        DT: data.DT, // Data nếu có
      });
    } catch (err) {
      console.error("Lỗi hệ thống:", err);
      return res.status(500).json({
        EM: "Lỗi hệ thống", // error message
        EC: "-2", // error code
        DT: "", // data
      });
    }
  }

  // [POST] /api/user/login
  async login(req, res, next) {
    try {
      const { PhoneNumber, Password } = req.body;

      if (!PhoneNumber || !Password) {
        return res.status(401).json({
          EM: "Nhập thiếu dữ liệu !!!",
          EC: -1,
          DT: [],
        });
      }

      let data = await UserSer.handleUserLogin({
        PhoneNumber,
        Password,
      });

      if (data.EC === 0) {
        return res
          .cookie("token", data.DT.token, {
            sameSite: "none",
            secure: true,
            httpOnly: true,
          })
          .status(200)
          .json({ EC: 0, EM: "Login successfully!!", DT: data.DT });
      }

      return res.status(200).json({
        EM: data.EM,
        EC: data.EC,
        DT: data.DT,
      });
    } catch (err) {
      console.log("err <<< ", err);
      return res.status(500).json({
        EM: "Lỗi hệ thống", // error message
        EC: "-2", // error code
        DT: "", // data
      });
    }
  }

  // [GET] /api/user/logout
  async logout(req, res, next) {
    try {
      res.cookie("token", "");
      return res
        .status(200)
        .json({ EM: "Đăng xuất thành công", EC: 0, DT: [] });
    } catch (err) {
      return res.status(500).json({ msg: "Error logout.", err: err.message });
    }
  }

  // [GET] /api/user/getProfile
  async fecthProfile(req, res) {
    try {
      const token = req.cookies.token;

      console.log(">>>>>>>>.token", token);
      if (!token) {
        return res.status(200).json({
          EM: "Người dùng chưa đăng nhập",
          EC: -1,
          DT: [],
        });
      }
      const dataUser = jwt.verify(token, process.env.JWT_KEY);
      return res.status(200).json({
        EM: "Người dùng đã đăng nhập",
        EC: 0,
        DT: dataUser,
      });
    } catch (err) {
      console.log("err <<< ", err);
      return res.status(500).json({ err: err });
    }
  }

  async updateUser(req, res) {
    try {
      // Lấy dữ liệu cần cập nhật từ request body
      const { id, UserName, PhoneNumber, Email } = req.body;

      // Kiểm tra dữ liệu đầu vào
      if (!UserName || !PhoneNumber || !Email) {
        return res.status(400).json({
          EM: "Thiếu thông tin cần thiết",
          EC: -1,
          DT: null,
        });
      }

      // Gọi service để cập nhật thông tin người dùng
      const result = await UserSer.updateUser(id, {
        UserName,
        PhoneNumber,
        Email,
      });

      // Trả về kết quả sau khi cập nhật
      return res.status(200).json({
        EM: result.EM,
        EC: result.EC,
        DT: result.DT,
      });
    } catch (err) {
      console.error("Lỗi khi cập nhật thông tin người dùng:", err);
      return res.status(500).json({
        EM: "Lỗi hệ thống",
        EC: -2,
        DT: null,
      });
    }
  }

  async readPanigation(req, res) {
    try {
      let page = +req.query.page;
      let limit = +req.query.limit;
      let sort = req.query.sort;

      let data = await UserSer.readPanigation(req.query);

      return res.status(200).json({
        EM: data.EM,
        EC: data.EC,
        DT: data.DT,
      });
    } catch (err) {
      console.log("err <<< ", err);
      return res.status(500).json({
        EM: "error server",
        EC: "-1",
        DT: "",
      });
    }
  }

  async dashboard(req, res) {
    try {
      // check vaidate
      const data = await UserSer.dashboard();
      return res.status(200).json({
        EM: data.EM,
        EC: data.EC,
        DT: data.DT,
      });
    } catch (error) {
      console.log(">>> error", error);
    }
  }

  // Hàm lấy thông tin người dùng theo ID
  async getUserById(req, res) {
    try {
      const { id } = req.query; // Lấy ID từ tham số URL
      console.log("ID", id);

      // Validate ID
      if (!id) {
        return res.status(400).json({
          EM: "Thiếu ID người dùng !!!",
          EC: "-1",
          DT: "",
        });
      }

      // Lấy thông tin người dùng
      const user = await UserSer.getUserById(id);

      // Kiểm tra nếu không tìm thấy người dùng
      if (!user) {
        return res.status(404).json({
          EM: "Không tìm thấy người dùng.",
          EC: "1",
          DT: "",
        });
      }

      return res.status(200).json({
        EM: "Lấy thông tin người dùng thành công.",
        EC: "0",
        DT: user,
      });
    } catch (err) {
      console.error("Lỗi khi lấy thông tin người dùng:", err); // Log lỗi ra console
      return res.status(500).json({
        EM: "Lỗi hệ thống", // thông báo lỗi
        EC: "-2", // mã lỗi
        DT: "", // dữ liệu
      });
    }
  }

  // [GET] /api/user/getCurrentUser
  async getCurrentUser(req, res) {
    try {
      // Lấy token từ headers
      const token = req.headers.authorization?.split(" ")[1];

      if (!token) {
        return res.status(401).json({
          EM: "Không có token, người dùng chưa đăng nhập",
          EC: -1,
          DT: null,
        });
      }

      // Xác thực và giải mã token
      jwt.verify(token, process.env.JWT_KEY, async (err, decoded) => {
        if (err) {
          return res.status(403).json({
            EM: "Token không hợp lệ hoặc đã hết hạn",
            EC: -1,
            DT: null,
          });
        }

        // Lấy thông tin người dùng từ payload của token
        const id = decoded.Id;

        // Sử dụng UserSer để lấy thông tin người dùng
        const user = await UserSer.getUserById(id);

        if (!user) {
          return res.status(404).json({
            EM: "Người dùng không tồn tại",
            EC: -1,
            DT: null,
          });
        }

        // Trả về thông tin người dùng
        return res.status(200).json({
          EM: "Lấy thông tin người dùng thành công",
          EC: 0,
          DT: user,
        });
      });
    } catch (err) {
      console.error("Lỗi khi lấy thông tin người dùng:", err);
      return res.status(500).json({
        EM: "Lỗi hệ thống",
        EC: -2,
        DT: null,
      });
    }
  }
}

export default new UserController();
