const express = require("express");
const router = express.Router();
import UserController from "../Controllers/UserController";

router.post("/register", UserController.register);
router.post("/login", UserController.login);
router.get("/logout", UserController.logout);
router.get("/fecthProfile", UserController.fecthProfile);
router.post("/updateUser", UserController.updateUser);
router.get("/readPanigation", UserController.readPanigation);
router.get("/dashboard", UserController.dashboard);
router.get("/getCurrentUser", UserController.getCurrentUser);
router.get("/getUserById", UserController.getUserById);

export default router;
