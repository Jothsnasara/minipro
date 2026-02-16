/*const express = require("express");
const bcrypt = require("bcrypt");
const db = require("../config/db");

const router = express.Router();

router.post("/login", async (req, res) => {
  // ✅ log the received request body here, inside the route
  console.log("Received body:", req.body);

  const { username, password } = req.body;
  console.log("Username:", username, "Password:", password);

  db.query(
    "SELECT * FROM users WHERE username = ?",
    [username],
    async (err, result) => {
      if (err || result.length === 0) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const user = result[0];

      if (user.status !== "Active") {
        return res.status(403).json({ message: "Account is inactive" });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      console.log("Password match:", isMatch); // ✅ debug
      if (!isMatch) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      res.json({
        message: "Login success",
        user: {
          id: user.id,
          name: user.name,
          username: user.username,
          role: user.role,
        },
      });
    }
  );
});

module.exports = router;*/


/*const express = require("express");
const router = express.Router();

const {
  register,
  login,
  getAllUsers
} = require("../controllers/authController");

router.post("/register", register);
router.post("/login", login);
router.get("/users", getAllUsers);

module.exports = router;

*/


const express = require("express");
const router = express.Router();

const {
  register,
  login,
  getAllUsers,
  forgotPassword,
  resetPassword,
  resignUser,
  updateUser
} = require("../controllers/authController");



/* ===== Auth ===== */
router.post("/register", register);
router.post("/login", login);

/* ===== Users ===== */
router.get("/users", getAllUsers);

router.put("/users/:id/resign", resignUser);
router.put("/users/:id", updateUser);


/* ===== Forgot Password ===== */
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

module.exports = router;