import BaseFilterManager from "./BaseFilterManager";
import CourseOffered from "../models/CourseOffered";

class CourseFilterManager extends BaseFilterManager {
  constructor() {
    super(CourseOffered);
  }

  /**
   * Add course-specific filtering logic if needed (e.g., category, availability).
   * @param {Object} filters - Filtering conditions.
   * @returns {Object} Enhanced MongoDB query object.
   */
  applyFilters(filters) {
    const query = super.applyFilters(filters);
    if (filters.isAvailable !== undefined) {
      query.isAvailable = filters.isAvailable;
    }
    return query;
  }

  /**
   * Filter courses with pagination.
   * @param {Object} filters - Filtering conditions.
   * @param {Number} page - Page number for pagination.
   * @param {Number} limit - Number of items per page.
   * @returns {Object} Filtered and paginated courses.
   */
  async filterCourses(filters, page = 1, limit = 10) {
    const query = this.applyFilters(filters);
    return this.paginate(query, page, limit);
  }
}

export default CourseFilterManager;
