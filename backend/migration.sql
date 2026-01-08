ALTER TABLE class_schedules ADD COLUMN IF NOT EXISTS frequency integer NOT NULL DEFAULT 1;
ALTER TABLE class_schedules ADD COLUMN IF NOT EXISTS location_id uuid;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_class_schedules_location_id') THEN ALTER TABLE class_schedules ADD CONSTRAINT fk_class_schedules_location_id FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE SET NULL; END IF; END $$;
