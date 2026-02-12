



/*require("dotenv").config();
const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");

const app = express();
app.use(cors());
app.use(express.json());

// -------------------- MYSQL --------------------
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

db.connect(err => {
  if (err) return console.error("DB error:", err);
  console.log("MySQL connected");
});

// -------------------- MAIL --------------------
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});


// -------------------- REGISTER --------------------
app.post("/register", async (req, res) => {
  const { name, email, username, password, role } = req.body;

  if (!name || !email || !username || !password)
    return res.status(400).json({ message: "All fields are required" });

  // Gmail validation
  const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
  if (!gmailRegex.test(email))
    return res.status(400).json({ message: "Only Gmail addresses are allowed" });

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = Math.floor(100000 + Math.random() * 900000);

    const sql = `
      INSERT INTO users
      (name, email, username, password, role, otp, is_verified)
      VALUES (?, ?, ?, ?, ?, ?, 0)
    `;

    db.query(
      sql,
      [name, email, username, hashedPassword, role || "member", otp],
      (err) => {
        if (err) {
          if (err.code === "ER_DUP_ENTRY")
            return res.status(409).json({ message: "Username or email already exists" });
          return res.status(500).json({ message: "Registration failed" });
        }

        // ✅ SEND OTP MAIL
        transporter.sendMail(
          {
            from: process.env.EMAIL_USER,
            to: email,
            subject: "OTP Verification",
            text: `Hello ${name},\nYour OTP is: ${otp}`
          },
          (error) => {
            if (error)
              return res.status(500).json({ message: "Failed to send OTP email" });

            res.json({
              message: "Registered successfully! Check email for OTP",
              username
            });
          }
        );
      }
    );
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// -------------------- VERIFY OTP --------------------
app.post("/verify-otp", (req, res) => {
  const { username, otp } = req.body;

  db.query(
    "SELECT * FROM users WHERE username = ? AND otp = ?",
    [username, otp],
    (err, result) => {
      if (err || result.length === 0)
        return res.status(400).json({ message: "Invalid OTP" });

      db.query(
        "UPDATE users SET is_verified = 1, otp = NULL WHERE username = ?",
        [username],
        () => res.json({ message: "Account verified" })
      );
    }
  );
});

// -------------------- RESEND OTP --------------------
app.post("/resend-otp", (req, res) => {
  const { username } = req.body;

  if (!username)
    return res.status(400).json({ message: "Username required" });

  const newOtp = Math.floor(100000 + Math.random() * 900000);

  db.query(
    "SELECT email, name FROM users WHERE username = ? AND is_verified = 0",
    [username],
    (err, result) => {
      if (err || result.length === 0)
        return res.status(400).json({ message: "User not found or already verified" });

      const { email, name } = result[0];

      db.query(
        "UPDATE users SET otp = ? WHERE username = ?",
        [newOtp, username],
        (err) => {
          if (err)
            return res.status(500).json({ message: "Failed to generate OTP" });

          transporter.sendMail(
            {
              from: process.env.EMAIL_USER,
              to: email,
              subject: "Resent OTP Verification",
              text: `Hello ${name},\nYour new OTP is: ${newOtp}`
            },
            (error) => {
              if (error)
                return res.status(500).json({ message: "Failed to send OTP" });

              res.json({ message: "New OTP sent to your email" });
            }
          );
        }
      );
    }
  );
});

// -------------------- LOGIN --------------------
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  db.query(
    "SELECT * FROM users WHERE username = ?",
    [username],
    async (err, result) => {
      if (err || result.length === 0)
        return res.status(401).json({ message: "Invalid credentials" });

      const user = result[0];

      if (!user.is_verified)
        return res.status(403).json({ message: "Verify OTP first" });

      const match = await bcrypt.compare(password, user.password);
      if (!match)
        return res.status(401).json({ message: "Invalid credentials" });

      res.json({
        message: "Login success",
        user: {
          id: user.id,
          name: user.name,
          username: user.username,
          role: user.role
        }
      });
    }
  );
});


// -------------------- FORGOT PASSWORD --------------------
app.post("/forgot-password", (req, res) => {
  const { email } = req.body;

  if (!email)
    return res.status(400).json({ message: "Email is required" });

  const resetOtp = Math.floor(100000 + Math.random() * 900000);
  const expiry = Date.now() + 5 * 60 * 1000; // 5 minutes

  db.query(
    "SELECT name FROM users WHERE email = ?",
    [email],
    (err, result) => {
      if (err || result.length === 0)
        return res.status(404).json({ message: "Email not found" });

      const { name } = result[0];

      db.query(
        "UPDATE users SET reset_otp = ?, reset_otp_expiry = ? WHERE email = ?",
        [resetOtp, expiry, email],
        (err) => {
          if (err)
            return res.status(500).json({ message: "Failed to generate reset OTP" });

          transporter.sendMail(
            {
              from: process.env.EMAIL_USER,
              to: email,
              subject: "Password Reset OTP",
              text: `Hello ${name},\nYour password reset OTP is: ${resetOtp}\nThis OTP is valid for 5 minutes.`
            },
            (error) => {
              if (error)
                return res.status(500).json({ message: "Failed to send email" });

              res.json({ message: "Reset OTP sent to email" });
            }
          );
        }
      );
    }
  );
});


// -------------------- RESET PASSWORD --------------------
app.post("/reset-password", async (req, res) => {
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
        () => res.json({ message: "Password reset successful" })
      );
    }
  );
});

// -------------------- SERVER --------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));  */


require("dotenv").config();
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/", authRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));

