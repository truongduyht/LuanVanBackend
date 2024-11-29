import Models from "../Models/index";
import jwt from "jsonwebtoken";
import bcrypt, { genSaltSync } from "bcrypt";
const salt = genSaltSync(10);

// Hash Password
const hashUserPassword = (userPassword) => {
  let hashPassword = bcrypt.hashSync(userPassword, salt);
  return hashPassword;
};

// Kiểm tra Password
const checkPassword = (inputPassword, hashPassword) => {
  return bcrypt.compare(inputPassword, hashPassword);
};

// Kiểm tra Số Điện Thoại
const checkPhone = async (PhoneNumber) => {
  let user = null;

  user = await Models.User.findOne({
    PhoneNumber: PhoneNumber,
  });

  if (user === null) {
    return false;
  }
  return true; // Có tồn tại số điện thoại
};
const checkmail = async (Email) => {
  let user = null;

  user = await Models.User.findOne({
    Email: Email,
  });

  if (user === null) {
    return false;
  }
  return true; // Có tồn tại số điện thoại
};

// Kiểm tra người dùng có tồn tại không
const existCustomerByPhone = async (PhoneNumber) => {
  const User = await Models.User.findOne({
    PhoneNumber: PhoneNumber,
  });
  if (User) {
    return true;
  } else {
    return false;
  }
};

const existUser = async (PhoneNumber) => {
  const User = await Models.User.findOne({
    PhoneNumber: PhoneNumber,
  });
  if (User) {
    return true;
  } else {
    return false;
  }
};

const exitsUserByid = async (id) => {
  const User = await Models.User.findById(id);
  if (!User) {
    return false;
  } else {
    return true;
  }
};
const getUserById = async (id) => {
  try {
    const user = await Models.User.findById(id).select("-Password");
    return user;
  } catch (error) {
    console.error("Lỗi khi lấy thông tin người dùng:", error);
    return null;
  }
};
// Đăng ký
// B1. kiểm tra số điện thoại  -> B2. hashpassword -> B3. create new user
const registerNewUser = async (rawUserData) => {
  const { UserName, PhoneNumber, Password, Email } = rawUserData;
  try {
    // B1
    let PhoneExits = await checkPhone(PhoneNumber);
    let MailExits = await checkmail(Email);
    if (PhoneExits === true) {
      return {
        EM: "Số điện thoại đã tồn tại !!!",
        EC: -1,
        DT: [],
      };
    }
    if (MailExits === true) {
      return {
        EM: "Email đã tồn tại !!!",
        EC: -1,
        DT: [],
      };
    }

    // B2
    let hashPassword = hashUserPassword(Password);

    // B3
    const User = await Models.User.create({
      UserName: UserName,
      PhoneNumber: PhoneNumber,
      Email: Email,
      Password: hashPassword,
      Role: "Khach_Hang",
    });

    if (User) {
      return {
        EM: "Tạo tài khoản thành công",
        EC: 0,
        DT: User,
      };
    }
  } catch (err) {
    console.log(">>> err ", err);
    return {
      EM: "Loi server !!!",
      EC: -2,
    };
  }
};

//Lấy thông tin người dùng để đăng nhập
const getUserLoginWithPhone = async (PhoneNumber) => {
  let user = null;
  user = await Models.User.findOne({
    PhoneNumber: PhoneNumber,
  });
  return user;
};

// Đăng nhập
const handleUserLogin = async (rawData) => {
  const { PhoneNumber, Password } = rawData;
  try {
    let user = await getUserLoginWithPhone(PhoneNumber);

    if (user === null) {
      return {
        EM: "Số điện thoại không đúng !!!",
        EC: -2,
        DT: "",
      };
    }

    let CorrectPassword = await checkPassword(Password, user.Password);

    if (CorrectPassword === true) {
      let tokentData = {
        Id: user._id,
        UserName: user.UserName,
        Email: user.Email,
        Role: user.Role,
        PhoneNumber: user.PhoneNumber,
      };
      const token = jwt.sign(tokentData, process.env.JWT_KEY, {
        expiresIn: "1h",
      });

      return {
        EM: "Ok",
        EC: 0,
        DT: {
          token,
          tokentData,
        },
      };

      // Tiếp tục
    } else {
      return {
        EM: " Mật khẩu sai !!!",
        EC: -2,
        DT: "",
      };
    }
  } catch (err) {
    console.log(">>> err", err);
    return {
      EM: "Lỗi server !!!",
      EC: -2,
      DT: "",
    };
  }
};

// Cập nhật thông tin người dùng
const updateUser = async (id, updatedData) => {
  console.log("------------------", id, updatedData);

  try {
    // Kiểm tra xem người dùng có tồn tại không và cập nhật thông tin cùng lúc
    const user = await Models.User.findByIdAndUpdate(
      id,
      {
        UserName: updatedData.UserName,
        PhoneNumber: updatedData.PhoneNumber,
        Email: updatedData.Email,
      },
      { new: true } // Tùy chọn này trả về tài liệu đã cập nhật thay vì tài liệu cũ
    );

    // Nếu không tìm thấy người dùng
    if (!user) {
      return {
        EM: "Người dùng không tồn tại",
        EC: -1,
        DT: null,
      };
    }

    return {
      EM: "Cập nhật thông tin thành công",
      EC: 0,
      DT: user,
    };
  } catch (err) {
    console.error("Lỗi khi cập nhật người dùng:", err);
    return {
      EM: "Lỗi hệ thống",
      EC: -2,
      DT: null,
    };
  }
};

const readPanigation = async (rawData) => {
  const { page, limit, sort } = rawData;

  try {
    if (!page && !limit && !sort) {
      const data = await Models.User.find({ Role: { $ne: "admin" } }); // Lọc những người dùng có vai trò khác admin
      console.log("------------", data);
      return {
        EM: "Lấy dữ liệu thành công",
        EC: 0,
        DT: data,
      };
    }

    let offset = (page - 1) * limit;

    const filter = { Role: { $ne: "admin" } }; // Lọc những người dùng có vai trò khác admin
    const sorter = {};

    if (sort?.startsWith("-")) {
      sorter[sort.substring(1)] = -1;
    } else {
      sorter[sort] = 1;
    }

    const pagination = await Models.User.find(filter)
      .skip(offset)
      .limit(limit)
      .sort(sorter)
      .exec();

    const totalRecords = await Models.User.countDocuments(filter);
    const meta = {
      current: page,
      pageSize: limit,
      pages: Math.ceil(totalRecords / limit),
      total: totalRecords,
    };
    const data = { pagination, meta };
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
const dashboard = async () => {
  try {
    const nonAdminUserCount = await Models.User.countDocuments({
      Role: { $ne: "admin" },
    });
    const fieldcount = await Models.Field.countDocuments({});
    const bookCount = await Models.DetailBook.countDocuments({
      Status: "complete",
    });
    const data = {
      user: nonAdminUserCount,
      field: fieldcount,
      book: bookCount,
    };
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

export default {
  registerNewUser,
  handleUserLogin,
  updateUser,
  readPanigation,
  dashboard,
  getUserById,
};
