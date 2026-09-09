const express = require("express");
const multer = require("multer");

const router = express.Router();

const {
  importMembers,
} = require("../controllers/importController");

const {
  protect,
} = require("../middleware/authMiddleware");


// File memory me rahegi
// Kyunki importController req.file.buffer read kar raha hai
const storage = multer.memoryStorage();

const upload = multer({
  storage,

  limits: {
    fileSize: 5 * 1024 * 1024,
  },

  fileFilter: (req, file, cb) => {

    const allowedExtensions =
      /\.(xlsx|xls|csv)$/i;

    if (
      allowedExtensions.test(
        file.originalname
      )
    ) {
      return cb(null, true);
    }

    cb(
      new Error(
        "Only Excel or CSV files are allowed"
      )
    );
  },
});


router.post(
  "/members",
  protect,
  upload.single("file"),
  importMembers
);


module.exports = router;