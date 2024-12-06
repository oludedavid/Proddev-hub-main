import express from "express";
import CourseFilterManager from "../services/filter/CourseFilterManager.js";

const router = express.Router();

/**
 * @route GET /courses/filter
 * @description Filter courses based on provided criteria (e.g., name, availability).
 * @access Public
 * @query {string} name - The name or part of the name of the course (from the query string).
 * @query {string} category - The category of the course (from the query string).
 * @query {boolean} isAvailable - Whether the course is available (from the query string).
 * @query {number} page - The page number for pagination (from the query string).
 * @query {number} limit - The number of items per page for pagination (from the query string).
 * @returns {Object} Filtered and paginated courses.
 */
router.get("/courses/filter", async (req, res) => {
  const filters = req.query;
  const page = req.query.page || 1;
  const limit = req.query.limit || 10;

  try {
    const courseFilterManager = new CourseFilterManager();
    const result = await courseFilterManager.filterCourses(
      filters,
      page,
      limit
    );
    res.status(200).send(result);
  } catch (error) {
    res.status(400).send({ error: "Error applying filters", details: error });
  }
});

export default router;
