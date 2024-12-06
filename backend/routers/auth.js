import AuthenticationManager from "../services/AuthenticationManager.js";
import auth from "../middleware/auth.js";
import rateLimit from "express-rate-limit";
import { validationResult, body } from "express-validator";
import express from "express";

const router = express.Router();
const AuthManager = new AuthenticationManager();
const register = AuthManager.registerUsers;
const login = AuthManager.loginUsers;

/**
 * Error handling middleware.
 * Catches errors in route handlers and sends a formatted error response.
 */
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  res
    .status(err.status || 500)
    .json({ message: err.message || "Server Error" });
};

/**
 * Input validation middleware.
 * Validates the incoming request body using express-validator.
 * If there are validation errors, sends a 400 response.
 */
const validateInputs = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Too many login attempts. Please try again later.",
});

/**
 * Route to register a new user.
 * POST /auth/register
 * Request body: { fullName, email, password }
 * Success response: 201 Created with user details
 * Error response: 400 Bad Request with validation errors
 */
router.post(
  "/auth/register",
  [
    body("fullName").notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Invalid email"),
    body("password").isLength({ min: 7 }).withMessage("Password too short"),
  ],
  validateInputs,
  register.signup
);

/**
 * Route to verify user email using the token.
 * POST /auth/register/verify
 * Query parameter: token (verification token)
 * Success response: 200 OK with success message
 * Error response: 400 Bad Request with error message (e.g., invalid token, expired token)
 */
router.post("/auth/register/verify", register.verifyEmail);

/**
 * Route to log in with credentials.
 * POST /auth/login/credentials
 * Request body: { email, password }
 * Success response: 200 OK with token
 * Error response: 400 Bad Request with validation errors or 401 Unauthorized
 */
router.post(
  "/auth/login/credentials",
  loginRateLimiter,
  [
    body("email").isEmail().withMessage("Invalid email"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  validateInputs,
  login.loginWithPassword
);

/**
 * Route to log in with Google authentication.
 * POST /auth/login/google
 * Request body: { token } (Google OAuth token)
 * Success response: 200 OK with token
 * Error response: 401 Unauthorized if the token is invalid
 */
router.post("/auth/login/google", login.loginWithGoogle);

/**
 * Route to log out the current user.
 * POST /auth/logout
 * Middleware: AuthMiddleware (checks if the user is logged in)
 * Success response: 200 OK with logout confirmation
 * Error response: 401 Unauthorized if not logged in
 */
router.post("/auth/logout", auth, login.logout);

/**
 * Route to log out from all sessions.
 * POST /auth/logout/session
 * Middleware: AuthMiddleware (checks if the user is logged in)
 * Success response: 200 OK with logout confirmation for all sessions
 * Error response: 401 Unauthorized if not logged in
 */
router.post("/auth/logout/session", auth, login.logoutAll);

/**
 * Global error handler middleware.
 * Catches errors passed through the application and sends a formatted error response.
 */
router.use(errorHandler);

export default router;
