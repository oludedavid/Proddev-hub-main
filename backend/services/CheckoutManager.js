import Cart from "../models/Cart";
import Order from "../models/Order";
import User from "../models/User";

class CartManager {
  #owner;
  #cart;

  constructor(owner) {
    this.#owner = owner;
  }

  /**
   * Creates a formal cart at checkout.
   * @param {Array} cartItems - Items fetched from localStorage (courses).
   * @returns {Object} The formally created cart.
   */
  async createCart(cartItems) {
    try {
      const doesOwnerExist = await User.findById(this.#owner._id);
      if (!doesOwnerExist) {
        throw new Error("Owner does not exist. Please log in.");
      }

      const existingCart = await Cart.findOne({ owner: this.#owner._id });
      if (existingCart) {
        throw new Error("A cart already exists for this user.");
      }

      const newCart = new Cart({
        owner: this.#owner._id,
        courses: cartItems,
      });

      await newCart.save();
      this.#cart = newCart;
      return newCart;
    } catch (error) {
      throw new Error(`Error creating cart: ${error.message}`);
    }
  }

  /**
   * Fetches the user's cart.
   * @returns {Object} The user's cart.
   */
  async #fetchCart() {
    // Private method for internal cart fetching
    try {
      const cart = await Cart.findOne({ owner: this.#owner._id });
      if (!cart) {
        throw new Error("No cart found for this user.");
      }
      return cart;
    } catch (error) {
      throw new Error(`Error fetching cart: ${error.message}`);
    }
  }

  /**
   * Public method to check if a cart exists for the user.
   * @returns {Boolean} True if a cart exists, false otherwise.
   */
  async doesCartExist() {
    try {
      await this.#fetchCart();
      return true;
    } catch {
      return false;
    }
  }
}

class OrderManager {
  #owner;

  constructor(owner) {
    this.#owner = owner;
  }

  /**
   * Creates an order from a cart.
   * @param {ObjectID} cartId - ID of the user's cart.
   * @returns {Object} The newly created order.
   */
  async createOrder(cartId) {
    try {
      const cart = await Cart.findById(cartId);
      if (!cart || cart.owner.toString() !== this.#owner._id.toString()) {
        throw new Error("Cart not found or does not belong to the user.");
      }

      const existingOrder = await Order.findOne({ cart: cartId });
      if (existingOrder) {
        throw new Error("An order for this cart already exists.");
      }

      const newOrder = new Order({
        owner: this.#owner._id,
        cart: cart._id,
      });

      await newOrder.save();
      return newOrder;
    } catch (error) {
      throw new Error(`Error creating order: ${error.message}`);
    }
  }
}

class CheckoutManager {
  #cartManager;
  #orderManager;

  constructor(owner) {
    this.#cartManager = new CartManager(owner);
    this.#orderManager = new OrderManager(owner);
  }

  /**
   * Orchestrates the checkout process.
   * @param {Array} cartItems - Items fetched from localStorage (courses).
   * @returns {Object} The created order.
   */
  async checkout(cartItems) {
    try {
      const cart = await this.#cartManager.createCart(cartItems);
      const order = await this.#orderManager.createOrder(cart._id);
      return order;
    } catch (error) {
      throw new Error(`Error during checkout: ${error.message}`);
    }
  }
}

export default CheckoutManager;
