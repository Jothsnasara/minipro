const express = require("express");
const router = express.Router();

const {
  register,
  login,
  getAllUsers,
  getManagers,
  forgotPassword,
  resetPassword,
  resignUser,
  updateUser,
  getMembers
} = require("../controllers/authController");

const { verifyToken, isAdmin, isManager } = require("../middleware/authMiddleware");

/* ===== Auth ===== */
router.post("/register", verifyToken, isAdmin, register);
router.post("/login", login);

/* ===== Users ===== */
router.get("/users/managers", verifyToken, isManager, getManagers);
router.get("/users/members", verifyToken, getMembers);
router.get("/users", verifyToken, isAdmin, getAllUsers);

router.put("/users/:id/resign", verifyToken, isAdmin, resignUser);
router.put("/users/:id", verifyToken, isAdmin, updateUser);


/* ===== Forgot Password ===== */
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

module.exports = router;