import express from "express";
import { protect } from "../middleware/authmiddleware.js";
import { handleDBQuery } from "../controller/userController.js";

const router = express.Router();

router.use(protect); // Only logged-in users

router.post("/query", handleDBQuery); // All DB query requests (to be built in Day 2)

export default router;
