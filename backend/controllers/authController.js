






const bcrypt = require("bcrypt");
const db = require("../config/db");
const transporter = require("../config/mail");

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

    db.query(
      sql,
      [name, email, username, hashedPassword, safeRole, status],
      async (err) => {
        if (err) {
          if (err.code === "ER_DUP_ENTRY") {
            return res
              .status(409)
              .json({ message: "Username or email already exists" });
          }
          return res.status(500).json({ message: "Registration failed" });
        }

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
      }
    );
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};


/* ================= LOGIN ================= */
exports.login = (req, res) => {
  const { username, password } = req.body;

  db.query(
    "SELECT * FROM users WHERE username = ?",
    [username],
    async (err, result) => {
      if (err || result.length === 0) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const user = result[0];

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
    }
  );
};

/* ================= FORGOT PASSWORD ================= */
exports.forgotPassword = (req, res) => {
  const { email } = req.body;

  if (!email)
    return res.status(400).json({ message: "Email is required" });

  const otp = Math.floor(100000 + Math.random() * 900000);
  const expiry = Date.now() + 5 * 60 * 1000; // 5 minutes

  db.query(
    "SELECT name FROM users WHERE email = ?",
    [email],
    (err, result) => {
      if (err || result.length === 0)
        return res.status(404).json({ message: "Email not found" });

      const name = result[0].name;

      db.query(
        "UPDATE users SET reset_otp = ?, reset_otp_expiry = ? WHERE email = ?",
        [otp, expiry, email],
        async () => {
          try {
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
            res.status(500).json({ message: "Failed to send email" });
          }
        }
      );
    }
  );
};

/* ================= RESET PASSWORD ================= */
exports.resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword)
    return res.status(400).json({ message: "All fields are required" });

  db.query(
    "SELECT reset_otp, reset_otp_expiry FROM users WHERE email = ?",
    [email],
    async (err, result) => {
      if (err || result.length === 0)
        return res.status(400).json({ message: "Invalid request" });

      const user = result[0];

      if (
        user.reset_otp !== parseInt(otp) ||
        Date.now() > user.reset_otp_expiry
      ) {
        return res.status(400).json({ message: "Invalid or expired OTP" });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      db.query(
        `UPDATE users 
         SET password = ?, reset_otp = NULL, reset_otp_expiry = NULL 
         WHERE email = ?`,
        [hashedPassword, email],
        () => {
          res.json({ message: "Password reset successful" });
        }
      );
    }
  );
};
/* ================= DELETE USER ================= */
exports.resignUser = (req, res) => {
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

  db.query(sql, [resign_date, id], (err, result) => {
    if (err) {
      console.error("RESIGN USER ERROR 👉", err);
      return res.status(500).json({ message: "Failed to resign user" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User resigned successfully" });
  });
};


// backend/controllers/userController.js
exports.resignUser = (req, res) => {
  const { id } = req.params;
  const { resign_date } = req.body;

  if (!id || !resign_date) {
    return res.status(400).json({ message: "User ID and resign date are required" });
  }

  const sql = `
    UPDATE users
    SET resign_date = ?, status = NULL
    WHERE id = ?
  `;

  db.query(sql, [resign_date, id], (err, result) => {
    if (err) return res.status(500).json({ message: "Failed to update user" });
    if (result.affectedRows === 0) return res.status(404).json({ message: "User not found" });

    res.json({ message: "User resigned successfully" });
  });
};

/* ================= GET ALL USERS ================= */
exports.getAllUsers = (req, res) => {
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

  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({ message: "Failed to fetch users" });
    }
    res.json(results);
  });
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

  db.query(
    sql,
    [name, email, username, safeRole, safeStatus, id],
    (err) => {
      if (err) {
        console.log("UPDATE ERROR 👉", err);
        return res.status(500).json({ message: "Update failed" });
      }

      res.json({ message: "User updated successfully" });
    }
  );
};
