import bcrypt from "bcrypt";
import User from "../models/User.js";
import TempUser from "../models/TempUser.js";
import nodemailer from "nodemailer";
import axios from "axios";
import jwt from "jsonwebtoken";
import path from "path";
import dotenv from "dotenv";

import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

/**
 * The `Register` class handles user registration, email verification, and related tasks.
 * It provides methods for generating a verification token, sending verification emails,
 * and completing the registration process upon email verification.
 */
class Register {
  #emailTransporter;

  constructor() {
    this.#emailTransporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_TRANSPORTER_USER_MAIL,
        pass: process.env.EMAIL_TRANSPORTER_USER_PASSWORD,
      },
    });
  }

  /**
   * Generates a temporary verification token for email validation.
   * This token will be sent to the user's email address to confirm their registration.
   * @param {object} payload - The payload containing user information (email, full name).
   * @returns {string} - The JWT token.
   */
  #generateVerificationToken(payload) {
    return jwt.sign(payload, process.env.JWT_SECRET || "RANDOM-TOKEN", {
      expiresIn: "1h",
    });
  }

  /**
   * Sends the verification email to the user after successful registration.
   * This email contains a link with a token that the user must click to verify their email.
   * @param {string} email - The user's email address.
   * @param {string} fullName - The user's full name.
   * @param {string} token - The email verification token.
   */
  async #sendVerificationEmail(email, fullName, token) {
    const verificationUrl = `http://localhost:3000/verify-email?token=${token}`;
    const mailOptions = {
      from: process.env.EMAIL_TRANSPORTER_USER_MAIL,
      to: email,
      subject: "Verify Your Email Address",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2>Welcome to Our Platform!</h2>
          <p>Hi ${fullName},</p>
          <p>Please verify your email address by clicking the button below:</p>
          <p style="text-align: center;">
            <a href="${verificationUrl}" 
              style="display: inline-block; padding: 10px 20px; font-size: 16px; color: #fff; background-color: #4CAF50; text-decoration: none; border-radius: 5px;">
              Verify Email
            </a>
          </p>
          <p>If the button doesn't work, use the following link:</p>
          <p>${verificationUrl}</p>
          <p>If you didn't request this registration, please ignore this email or contact support.</p>
        </div>
      `,
    };

    await this.#emailTransporter.sendMail(mailOptions);
  }

  /**
   * Handles the user registration process by accepting user input, checking if a user exists,
   * hashing the password, and sending a verification email.
   * @param {object} req - The request object containing the user's registration data.
   * @param {object} res - The response object to send back a result or error message.
   */
  signup = async (req, res) => {
    const { fullName, email, password } = req.body;

    try {
      const doesUserExist = await User.findOne({ email });
      if (doesUserExist) {
        return res
          .status(400)
          .json({ message: "A user with that email already exists." });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const tempUser = new TempUser({
        fullName,
        email,
        password: hashedPassword,
      });

      await tempUser.save();

      const token = this.#generateVerificationToken({ email, fullName });
      await this.#sendVerificationEmail(email, fullName, token);

      res.status(200).json({
        message:
          "You are registered temporarily. Check your email to verify your account to complete registration.",
      });
    } catch (error) {
      console.error("Signup error:", error);
      res.status(500).json({ message: "Registration failed." });
    }
  };

  /**
   * Verifies the user's email address after they click the verification link in their email.
   * This will activate the user account by creating a new user record and deleting the temporary record.
   * @param {object} req - The request object containing the token for email verification.
   * @param {object} res - The response object to send back a result or error message.
   */
  verifyEmail = async (req, res) => {
    try {
      const { token } = req.body;
      if (!token) {
        return res.status(400).json({ message: "Token is required." });
      }

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "RANDOM-TOKEN"
      );
      if (!decoded || !decoded.email) {
        return res.status(400).json({ message: "Invalid verification token." });
      }

      const tempUser = await TempUser.findOne({ email: decoded.email });
      if (!tempUser) {
        return res.status(400).json({
          message:
            "You are a fully registered user. Please login into your account",
        });
      }

      const existingUser = await User.findOne({ email: decoded.email });
      if (existingUser) {
        return res.status(400).json({ message: "User already exists." });
      }

      // Create a new user document from the temporary user details
      const newUser = new User({
        fullName: tempUser.fullName,
        email: tempUser.email,
        password: tempUser.password,
        isVerified: true,
      });

      await newUser.save();
      await TempUser.deleteOne({ email: decoded.email });

      res.status(200).json({
        message: "Email verified successfully. You are now fully registered💃🏽",
      });
    } catch (error) {
      console.error("Verification error:", error);
      if (error.name === "TokenExpiredError") {
        return res.status(400).json({
          message: "Verification token expired. Please register again😫.",
        });
      }
      res.status(500).json({ message: "Verification failed." });
    }
  };
}

/**
 * The `Login` class handles user login, token generation, and logout functionality.
 * It provides methods for generating authentication tokens, logging users in, and managing logout.
 */
class Login {
  #clientId;
  #clientPassword;
  #redirectUrl;

  constructor() {
    this.#clientId = process.env.CLIENT_ID;
    this.#clientPassword = process.env.CLIENT_SECRET;
    this.#redirectUrl = process.env.REDIRECT_URI;
  }

  /**
   * Generates a new authentication token for the user.
   * This token will be used for authenticated requests.
   * @param {object} user - The user object to generate the token for.
   * @returns {string} - The JWT token.
   */
  #generateAuthToken(user) {
    const token = jwt.sign(
      { _id: user._id.toString() },
      process.env.JWT_SECRET || "RANDOM-TOKEN",
      { expiresIn: "1h" }
    );
    return token;
  }

  /**
   * Handles the user login process, checks user credentials, generates an authentication token,
   * and returns the user data along with the token.
   * @param {object} req - The request object containing the user's login credentials.
   * @param {object} res - The response object to send back the login result or error message.
   */
  loginWithPassword = async (req, res) => {
    const { email, password } = req.body;

    try {
      const user = await User.findByCredentials(email, password);
      if (!user) {
        return res.status(400).json({ message: "Invalid credentials." });
      }

      const token = this.#generateAuthToken(user);

      user.tokens = user.tokens.concat({ token });
      await user.save();

      res.status(200).json({
        message: "Login successful",
        token,
        user,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "An error occurred during login",
        errorMessage: error.message,
        error: error,
      });
    }
  };

  /**
   * The `googleLoginInitiator` method redirects the user to the Google OAuth2 authentication page.
   * This page allows the user to log in with their Google account and grant the application access
   * to their profile and email information. The redirect URL specified in the Google OAuth2 setup
   * will be used to send the user back to the application with an authorization code.
   *
   * @param {object} req - The request object.
   * @param {object} res - The response object to redirect the user to the Google login page.
   */
  googleLoginInitiator = async (req, res) => {
    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${
      this.#clientId
    }&redirect_uri=${this.#redirectUrl}&response_type=code&scope=profile email`;
    return res.redirect(url);
  };

  /**
   * The `loginWithGoogle` method handles the callback from Google's OAuth2 service after the user
   * has authenticated and granted permission. It exchanges the authorization code for an access
   * token and ID token, which are then used to retrieve the user's details. If the user is new to
   * the system, their information is saved in the database; otherwise, their existing account is
   * used to generate an authentication token for subsequent API requests.
   *
   * @param {object} req - The request object containing the raw token received from Google's OAuth2 service.
   * @param {object} res - The response object to send back the result or error message.
   *
   * @returns {object} - A response indicating whether the login process was successful.
   */
  loginWithGoogle = async (req, res) => {
    try {
      const code = req.rawToken;

      const response = await axios.post("https://oauth2.googleapis.com/token", {
        code,
        client_id: this.#clientId,
        client_secret: this.#clientPassword,
        redirect_uri: this.#redirectUrl,
        grant_type: "authorization_code",
      });
      const { accessToken, id_token } = response.data;

      // Fetch user details using the access token
      const userResponse = await axios.get(
        "https://www.googleapis.com/oauth2/v3/userinfo",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      const userDetails = userResponse.data;

      // Check if the user already exists in the database using their email
      let user = await User.checkIfUserExistsByEmail({
        email: userDetails.email,
      });

      if (!user) {
        user = new User({
          email: userDetails.email,
          fullName: userDetails.name,
          googleId: userDetails.id,
          googleSignIn: true,
        });

        const token = this.#generateAuthToken(user);
        user.tokens = user.tokens.concat({ token });

        await user.save();
      }

      res.status(200).json({ message: "Authentication successful" });
    } catch (error) {
      console.error("Error saving code:", error);
      res.status(500).json({ message: "Failed to save code" });
    }
  };

  /**
   * Handles user logout by removing the current authentication token.
   * @param {object} req - The request object containing the token to be removed.
   * @param {object} res - The response object to send back the result or error message.
   */
  logout = async (req, res) => {
    try {
      const token = req.token;
      const user = req.user;

      user.tokens = user.tokens.filter((t) => t.token !== token);
      await user.save();

      res.status(200).json({ message: "Logged out successfully." });
    } catch (error) {
      res.status(500).json({
        message: "An error occurred during logout",
        error: error.message,
      });
    }
  };

  /**
   * Handles logout from all devices by clearing all tokens associated with the user.
   * @param {object} req - The request object containing the user session.
   * @param {object} res - The response object to send back the result or error message.
   */
  logoutAll = async (req, res) => {
    try {
      const user = req.user;

      user.tokens = [];
      await user.save();

      res.status(200).json({ message: "Logged out from all sessions." });
    } catch (error) {
      res.status(500).json({
        message: "An error occurred during logout from all sessions",
        error: error.message,
      });
    }
  };
}

/**
 * The `AuthenticationManager` class is a wrapper for managing user registration and login functionalities.
 * It handles both user registration and login by delegating tasks to the respective `Register` and `Login` classes.
 */
class AuthenticationManager {
  constructor() {
    this.registerUsers = new Register();
    this.loginUsers = new Login();
  }
}

export default AuthenticationManager;
