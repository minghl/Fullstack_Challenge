import express from "express";
import {
  getRadars,
  addRadar,
  deleteRadars,
} from "../controllers/radar.js";

const router = express.Router();

router.get("/", getRadars);
// router.get("/:id", getPost);
router.post("/", addRadar);
router.delete("/", deleteRadars);
// router.put("/:id", updatePost);

export default router;
