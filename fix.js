const fs = require('fs');

const courses = [];
const phpStr = `...`; // omitted here because I'll just load parse_courses.cjs using require or copy the courses list?
// Wait, I can just require the courses logic from parse_courses.cjs if I export it. No, I'll just read parse_courses.cjs, execute it to get the courses.
