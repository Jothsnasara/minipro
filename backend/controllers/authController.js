






const bcrypt = require("bcrypt");
const db = require("../config/db");
const transporter = require("../config/mail");

/* ================= REGISTER (ADMIN ADD USER) ================= */
/* ================= REGISTER (ADMIN ADD USER) ================= */
exports.register = async (req, res) => {
  const { name, email, username, password, role } = req.body;

  if (!name || !email || !username || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
  if (!gmailRegex.test(email)) {
    return res.status(400).json({ message: "Only Gmail addresses are allowed" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const safeRole = ["admin", "manager", "member"].includes(role)
      ? role
      : "member";

    // ✅ STATUS RULE
    const status = safeRole === "admin" ? "Active" : "Inactive";

    const sql = `
      INSERT INTO users 
      (name, email, username, password, role, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    try {
      await db.query(sql, [name, email, username, hashedPassword, safeRole, status]);

      // 📧 Send email (unchanged)
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: "ProjectPulse Account Created",
        html: `
            <p>Hello ${name},</p>
            <p>Your account has been created.</p>
            <p>Username: <b>${username}</b></p>
            <p>Temporary Password: <b>${password}</b></p>
            <p>Status: <b>${status}</b></p>
          `,
      });

      res.json({
        message: "User added successfully",
        status
      });
    } catch (err) {
      if (err.code === "ER_DUP_ENTRY") {
        return res.status(409).json({ message: "Username or email already exists" });
      }
      throw err; // Re-throw to outer catch
    }
  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};


/* ================= LOGIN ================= */
exports.login = async (req, res) => {
  const { username, password } = req.body;

  try {
    const [rows] = await db.query("SELECT * FROM users WHERE username = ?", [username]);

    if (rows.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const user = rows[0];

    // 🚫 BLOCK INACTIVE USERS
    if (user.status !== "Active") {
      return res.status(403).json({
        message: "Account is inactive. Please wait for project assignment."
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // ✅ SEND RESPONSE ONLY ON SUCCESS
    res.json({
      message: "Login success",
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        role: user.role,
        status: user.status
      }
    });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= FORGOT PASSWORD ================= */
/* ================= FORGOT PASSWORD ================= */
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email)
    return res.status(400).json({ message: "Email is required" });

  const otp = Math.floor(100000 + Math.random() * 900000);
  const expiry = Date.now() + 5 * 60 * 1000; // 5 minutes

  try {
    const [rows] = await db.query("SELECT name FROM users WHERE email = ?", [email]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Email not found" });
    }

    const name = rows[0].name;

    await db.query(
      "UPDATE users SET reset_otp = ?, reset_otp_expiry = ? WHERE email = ?",
      [otp, expiry, email]
    );

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset Request",
      html: `
            <p>Dear ${name},</p>

            <p>We received a request to reset your password.</p>

            <p><b>Your One-Time Password (OTP):</b></p>
            <h2>${otp}</h2>

            <p>
              This OTP is valid for <b>5 minutes</b>.
              If you did not request a password reset, please ignore this email.
            </p>

            <p>Regards,<br/><b>ProjectPulse Team</b></p>
          `,
    });

    res.json({ message: "OTP sent to registered email" });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    res.status(500).json({ message: "Failed to process request" });
  }
};

/* ================= RESET PASSWORD ================= */
exports.resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword)
    return res.status(400).json({ message: "All fields are required" });

  try {
    const [rows] = await db.query("SELECT reset_otp, reset_otp_expiry FROM users WHERE email = ?", [email]);

    if (rows.length === 0)
      return res.status(400).json({ message: "Invalid request" });

    const user = rows[0];

    if (
      user.reset_otp !== parseInt(otp) ||
      Date.now() > user.reset_otp_expiry
    ) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await db.query(
      `UPDATE users 
         SET password = ?, reset_otp = NULL, reset_otp_expiry = NULL 
         WHERE email = ?`,
      [hashedPassword, email]
    );

    res.json({ message: "Password reset successful" });
  } catch (err) {
    console.error("Reset Password Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* ================= DELETE USER ================= */
exports.resignUser = async (req, res) => {
  const { id } = req.params;
  const { resign_date } = req.body; // date sent from frontend

  if (!id || !resign_date) {
    return res.status(400).json({ message: "User ID and resign date are required" });
  }

  const sql = `
    UPDATE users
    SET resigning_date = ?, status = NULL
    WHERE id = ?
  `;

  try {
    const [result] = await db.query(sql, [resign_date, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User resigned successfully" });
  } catch (err) {
    console.error("RESIGN USER ERROR 👉", err);
    return res.status(500).json({ message: "Failed to resign user" });
  }
};


/* ================= GET ALL USERS ================= */
exports.getManagers = async (req, res) => {
  const sql = "SELECT id, username, name, status FROM users WHERE role = 'manager'";
  try {
    const [rows] = await db.query(sql);
    res.json(rows);
  } catch (err) {
    console.error("Get Managers Error:", err);
    res.status(500).json({ message: "Failed to fetch managers" });
  }
};

exports.getMembers = async (req, res) => {
  const sql = "SELECT id, username, name, specialization, status FROM users WHERE role = 'member'";
  try {
    const [rows] = await db.query(sql);
    res.json(rows);
  } catch (err) {
    console.error("Get Members Error:", err);
    res.status(500).json({ message: "Failed to fetch members" });
  }
};

exports.getAllUsers = async (req, res) => {
  const sql = `
    SELECT 
      id,
      name,
      email,
      username,
      role,
      status,
      join_date,
      resign_date
    FROM users
    ORDER BY join_date DESC
  `;

  try {
    const [rows] = await db.query(sql);
    res.json(rows);
  } catch (err) {
    console.error("Get All Users Error:", err);
    res.status(500).json({ message: "Failed to fetch users" });
  }
};

exports.updateUser = async (req, res) => {
  const { id } = req.params;
  const { name, email, username, role, status } = req.body;

  if (!name || !email || !username) {
    return res.status(400).json({ message: "Required fields missing" });
  }

  const safeRole = ["admin", "manager", "member"].includes(role)
    ? role
    : "member";

  const safeStatus = ["Active", "Inactive"].includes(status)
    ? status
    : "Active";

  const sql = `
    UPDATE users
    SET name = ?, email = ?, username = ?, role = ?, status = ?
    WHERE id = ?
  `;

  try {
    await db.query(
      sql,
      [name, email, username, safeRole, safeStatus, id]
    );
    res.json({ message: "User updated successfully" });
  } catch (err) {
    console.log("UPDATE ERROR 👉", err);
    return res.status(500).json({ message: "Update failed" });
  }
};