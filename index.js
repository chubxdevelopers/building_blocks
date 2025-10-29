import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import authRoutes from "./routes/authRoute.js";
import { loginUser, verifyUser } from "./controller/authController.js";
import adminRoutes from "./routes/adminRoute.js";

import publicApiRoutes from "./routes/publicApiRoute.js";
import userRoutes from "./routes/userRoute.js";
import appRoutes from "./routes/appRoute.js";
import queryRoutes from "./routes/queryRoute.js";
import { appContext } from "./middleware/appContext.js";
import { attachJwt } from "./middleware/jwtAttach.js";

dotenv.config();
const app = express();

app.use(express.json());

// Enable CORS. We reflect the incoming origin (origin: true) so the
// Access-Control-Allow-Origin header contains the request origin. This
// is convenient for local development across different ports and works
// with credentials (cookies) as we set credentials: true.
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(cookieParser());

// Attach app/company context (reads first segment after /api)
app.use(appContext);

// Attach decoded JWT payload (if present) to req.jwt for security injection
app.use(attachJwt);

// Routes
// Mount routes under company + app slugs so frontend can call /api/:company/:appSlug/... for multi-tenant behavior
app.use("/api/:company/:appSlug/auth", authRoutes);
// Also expose the shorter login endpoints under /api/:company/:appSlug/login
// so frontend can POST to /api/:company/:app/login as requested.
app.post("/api/:company/:appSlug/login", appContext, loginUser);
app.get("/api/:company/:appSlug/verify", appContext, verifyUser);
app.use("/api/:company/:appSlug/admin", adminRoutes);
// app.use("/api/:company/:appSlug/public", );
app.use("/api/:company/:appSlug/user", userRoutes);
app.use("/api/:company/:appSlug/app", appRoutes);
// Public endpoints that don't require company/app context (used by SelectCompany UI)
app.use("/api/:company/:appSlug/public", publicApiRoutes);
// Expose a canonical query endpoint used by frontend clients: /api/query/v1/:resource
app.use("/api/query", queryRoutes);

// Use a default port when PORT isn't provided in environment for convenience
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
