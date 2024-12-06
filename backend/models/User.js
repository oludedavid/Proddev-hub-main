import mongoose from "mongoose";
import validator from "validator";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      validate(value) {
        if (!validator.isEmail(value)) {
          throw new Error("Email is invalid");
        }
      },
    },
    password: {
      type: String,
      minlength: 7,
      trim: true,
      validate(value) {
        if (value && value.toLowerCase().includes("password")) {
          throw new Error('Password cannot contain "password"');
        }
      },
    },

    role: {
      type: String,
      enum: ["guest", "student", "tutor", "admin"],
      default: "guest",
    },
    studentDetails: {
      enrolledCourses: [
        { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
      ],
    },
    tutorDetails: {
      offeredCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: "Course" }],
    },
    tokens: [
      {
        token: {
          type: String,
          required: true,
        },
      },
    ],
    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Generate JWT token
userSchema.methods.generateAuthToken = async function () {
  const user = this;
  const token = jwt.sign(
    { _id: user._id.toString() },
    process.env.JWT_SECRET || "RANDOM-TOKEN",
    { expiresIn: "1h" } // Set token expiration
  );
  user.tokens = user.tokens.concat({ token });
  await user.save();
  return token;
};

// Hash the password before saving
userSchema.pre("save", async function (next) {
  const user = this;
  if (user.isModified("password") && user.password) {
    user.password = await bcrypt.hash(user.password, 10);
  }
  next();
});

// Check credentials for password login
userSchema.statics.findByCredentials = async function (email, password) {
  try {
    const user = await this.findOne({ email });
    if (!user) {
      throw new Error("Unable to log in. Email not found.");
    }

    if (user.googleSignIn) {
      throw new Error(
        "This account was created via Google. Please set a password to proceed."
      );
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new Error("Unable to log in. Incorrect password.");
    }

    return user;
  } catch (error) {
    console.log(error);
    console.error("Error during login:", error.message);
    throw error;
  }
};

// Check if user exists by email
userSchema.statics.checkIfUserExistsByEmail = async function (email) {
  const user = await this.findOne({ email });
  return !!user;
};

// Logout the user by removing the token from the tokens array
userSchema.methods.logout = async function (token) {
  const user = this;
  user.tokens = user.tokens.filter((t) => t.token !== token);
  await user.save();
};

// Logout all tokens (logout all sessions)
userSchema.methods.logoutAll = async function () {
  const user = this;
  user.tokens = [];
  await user.save();
};

export default mongoose.model("User", userSchema);
