import express from "express";
// import authRoutes from "./routes/auth.js";
// import userRoutes from "./routes/users.js";
import radarRoutes from "./routes/radars.js";
import cookieParser from "cookie-parser";
import cors from 'cors';
import multer from "multer";
// import multpart from 'connect-multiparty';

// const multipartMiddleware = multpart();

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "../client/files");
  },
  filename: function (req, file, cb) {
    cb(null, 'file');
  },
});

// app.use(express.urlencoded({ extended: false }));
const upload = multer({ storage: storage });
// app.post("/api/upload", upload.single("file"), function (req, res) {
//   const file = req.file;
//   res.status(200).json(file.filename);
// });

// app.use("/api/auth", authRoutes);
// app.use("/api/users", userRoutes);
app.use("/api/radars", radarRoutes);
app.post('/api/upload'
  , upload.any()
  , (req, res) => {
    const formData = req.body;
    console.log('form data', formData);
    res.json({ data: req.body });
  });

app.listen(8800, () => {
  console.log("Connected!");
});
