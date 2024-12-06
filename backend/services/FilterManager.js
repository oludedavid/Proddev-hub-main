import CourseFilterManager from "./filters/CourseFilterManager";

class FilterManager {
  constructor() {
    this.courseFilterManager = new CourseFilterManager();
  }
}

export default new FilterManager();
