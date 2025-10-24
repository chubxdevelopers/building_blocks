import express from "express";
import { loginUser, verifyUser } from "../controller/authController.js";
const router = express.Router();

router.post("/login", loginUser);
router.get("/verify", verifyUser);

export default router;
