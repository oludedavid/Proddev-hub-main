import mongoose from "mongoose";

const courseOfferedSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      default: 1,
    },
    imageUrl: {
      type: String,
      required: true,
      default:
        "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?q=80&w=2069&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    },
    duration: {
      type: String,
      required: true,
    },
    tutor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    available: {
      type: Boolean,
      required: true,
    },
    maxNumberOfStudents: {
      type: Number,
      required: true,
    },
    numberOfEnrolledStudents: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

courseOfferedSchema.pre("save", function (next) {
  this.numberOfEnrolledStudents = this.students.length;
  next();
});

const CourseOffered = mongoose.model("CourseOffered", courseOfferedSchema);
export default CourseOffered;
