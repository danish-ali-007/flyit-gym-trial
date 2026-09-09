const express = require("express");

const router = express.Router();

const {
  addMember,
  getAllMembers,
  getMemberById,
  updateMember,
  deleteMember,
  searchMembers,
} = require("../controllers/memberController");

const { protect } = require("../middleware/authMiddleware");

// Search Route
// Specific route ko /:id se pehle rakhna zaroori hai
router.get("/search", protect, searchMembers);

// Add New Member
router.post("/", protect, addMember);

// Get All Members
router.get("/", protect, getAllMembers);

// Get Single Member
router.get("/:id", protect, getMemberById);

// Update Member
router.put("/:id", protect, updateMember);

// Delete Member
router.delete("/:id", protect, deleteMember);

module.exports = router;