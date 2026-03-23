const express = require("express");
const router = express.Router();
const { getNotifications, markAsRead, markAllAsRead } = require("../controllers/notificationController");
const { verifyToken } = require("../middleware/authMiddleware");

// All notification routes should require authentication
router.use(verifyToken);

router.get("/", getNotifications);
router.put("/read-all", markAllAsRead); // Place before /:id/read to avoid parameter collision
router.put("/:id/read", markAsRead);

module.exports = router;
