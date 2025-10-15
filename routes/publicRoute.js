import express from "express";
import { getPublicData } from "../controller/publicController.js";
const router = express.Router();

router.get("/", getPublicData);

export default router;
