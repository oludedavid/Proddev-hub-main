import mongoose from "mongoose";

const TempUserSchema = new mongoose.Schema({
  email: String,
  fullName: String,
  password: String,
  role: {
    type: String,
    enum: ["guest", "student", "tutor", "admin"],
    default: "guest",
  },
  createdAt: { type: Date, default: Date.now, expires: 3600 },
});

export default mongoose.model("TempUser", TempUserSchema);
