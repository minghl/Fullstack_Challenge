import express from "express";
import {
  getRadars,
  addRadar,
  deleteRadars,
  reloadRadars,
  batchRadars,
} from "../controllers/radar.js";

const router = express.Router();

router.get("/", getRadars);
router.post("/", addRadar);
router.delete("/", deleteRadars);
router.get("/reload", reloadRadars);
router.put("/", batchRadars);

export default router;
