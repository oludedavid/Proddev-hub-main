import mongoose from "mongoose";
const ObjectID = mongoose.Schema.Types.ObjectId;

const orderSchema = new mongoose.Schema(
  {
    owner: {
      type: ObjectID,
      required: true,
      ref: "User",
    },
    cart: {
      type: ObjectID,
      required: true,
      ref: "Cart",
    },
    totalAmount: {
      type: Number,
      required: true,
      default: 0,
    },
    orderStatus: {
      type: String,
      enum: ["pending", "shipped", "delivered", "canceled"],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      enum: ["credit_card", "paypal", "flutterwave", "bank_transfer"],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
    },
  },
  { timestamps: true }
);

orderSchema.pre("save", async function (next) {
  const cart = await mongoose.model("Cart").findById(this.cart);
  if (cart) {
    const cartTotal = cart.bill;
    this.totalAmount = cartTotal;
  }
  next();
});

const Order = mongoose.model("Order", orderSchema);
export default Order;
