CREATE TABLE IF NOT EXISTS class_courses (
    class_id uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    PRIMARY KEY (class_id, course_id)
);
CREATE INDEX IF NOT EXISTS idx_class_courses_class_id ON class_courses(class_id);
CREATE INDEX IF NOT EXISTS idx_class_courses_course_id ON class_courses(course_id);
