class BaseFilterManager {
  constructor(model) {
    if (!model) {
      throw new Error("Model is required for filtering");
    }
    this.model = model;
  }

  async search(searchString, page = 1, limit = 10) {
    const regex = new RegExp(searchString, "i");
    const searchQuery = {
      $or: [{ name: { $regex: regex } }, { category: { $regex: regex } }],
    };
    return this.paginate(searchQuery, page, limit);
  }

  /**
   * Apply filters to a query.
   * @param {Object} filters - Object containing filtering conditions.
   * @returns {Object} MongoDB query object.
   */
  applyFilters(filters) {
    const query = {};
    for (const [key, value] of Object.entries(filters)) {
      if (value) {
        if (key === "name") {
          query[key] = { $regex: new RegExp(value, "i") }; // Case-insensitive regex for name
        } else {
          query[key] = value;
        }
      }
    }
    return query;
  }

  /**
   * Paginate query results.
   * @param {Object} query - The MongoDB query object.
   * @param {Number} page - The page number.
   * @param {Number} limit - Number of items per page.
   * @returns {Object} Paginated results.
   */
  async paginate(query, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const results = await this.model.find(query).skip(skip).limit(limit);
    const total = await this.model.countDocuments(query);

    return {
      results,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Perform filtering based on provided conditions.
   * @param {Object} filters - Filtering conditions.
   * @param {Number} page - Page number for pagination.
   * @param {Number} limit - Number of items per page.
   * @returns {Object} Filtered and paginated results.
   */
  async filter(filters, page = 1, limit = 10) {
    const query = this.applyFilters(filters);
    return this.paginate(query, page, limit);
  }
}

export default BaseFilterManager;
