-- Run ONCE on a database that was created with the ORIGINAL code
-- (jobs.openings was NUMERIC(3,1); it is now INTEGER). New databases already
-- have the right type. Safe to re-run.
ALTER TABLE jobs ALTER COLUMN openings TYPE INTEGER USING openings::integer;
