import express from "express";
import CheckoutManager from "../services/CheckoutManager.js";
import auth from "../middleware/auth.js";

const router = express.Router();

/**
 * Endpoint to handle cart checkout.
 * @route POST /cart/checkout
 * @access Public (Requires authentication at certain stages)
 */
router.post("/cart/checkout", auth, async (req, res) => {
  try {
    const { cartItems } = req.body;
    const owner = req.user;

    const checkoutManager = new CheckoutManager(owner);

    const order = await checkoutManager.checkout(cartItems);

    res.status(200).json({ message: "Checkout successful", order });
  } catch (error) {
    res.status(400).json({
      error: "Error during checkout",
      details: error.message,
    });
  }
});

export default router;
