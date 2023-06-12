import express from "express";
import {
  getRadars,
  addRadar,
  deleteRadars,
  reloadRadars,
} from "../controllers/radar.js";

const router = express.Router();

router.get("/", getRadars);
router.post("/", addRadar);
router.delete("/", deleteRadars);
router.get("/reload", reloadRadars);

export default router;
