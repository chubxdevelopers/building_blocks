import express from "express";
import { loginUser, verifyUser } from "../controller/authController.js";
const router = express.Router();
import { appContext } from "../middleware/appContext.js";   


// Mount under /api/:company/:appSlug/auth/...
router.post("/login",appContext, loginUser);
router.get("/verify",appContext, verifyUser);

export default router;
