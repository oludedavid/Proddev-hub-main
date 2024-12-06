import mongoose from "mongoose";

const TempUserSchema = new mongoose.Schema({
  email: String,
  fullName: String,
  password: String,
  createdAt: { type: Date, default: Date.now, expires: 3600 },
});

export default mongoose.model("TempUser", TempUserSchema);
