import mongoose from "mongoose";

const cartSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    courses: [
      {
        courseOfferedId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "CourseOffered",
          required: true,
        },
        name: {
          type: String,
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          default: 1,
          min: 1,
        },
        price: {
          type: Number,
        },
      },
    ],
    bill: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

cartSchema.pre("save", function (next) {
  this.bill = this.courses.reduce((total, course) => {
    return total + course.quantity * course.price;
  }, 0);
  next();
});

const Cart = mongoose.model("Cart", cartSchema);

export default Cart;
