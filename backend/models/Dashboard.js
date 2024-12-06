import mongoose from "mongoose";
const ObjectID = mongoose.Schema.Types.ObjectId;

const dashboardSchema = new mongoose.Schema(
  {
    owner: {
      type: ObjectID,
      required: true,
      ref: "User",
    },
    userRole: {
      type: String,
      enum: ["admin", "tutor", "student"],
      required: true,
    },
    theme: {
      type: String,
      enum: ["light", "dark"],
      default: "light",
    },
  },
  { timestamps: true }
);

const Dashboard = mongoose.model("Dashboard", dashboardSchema);
export default Dashboard;
