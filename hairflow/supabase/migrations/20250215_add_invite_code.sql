-- Add invite_code to organizations
ALTER TABLE organizations 
ADD COLUMN invite_code TEXT UNIQUE;

-- Function to generate random invite code (6 chars)
CREATE OR REPLACE FUNCTION generate_invite_code() 
RETURNS TEXT AS $$
DECLARE
    chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    result TEXT := '';
    i INT;
BEGIN
    FOR i IN 1..6 LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically assign invite code on organization creation
CREATE OR REPLACE FUNCTION set_invite_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.invite_code IS NULL THEN
        LOOP
            NEW.invite_code := 'HF-' || generate_invite_code();
            BEGIN
                EXIT; -- Exit loop if successful (unique constraint check happens at insert)
            EXCEPTION WHEN unique_violation THEN
                -- If code exists, loop and try again
            END;
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_invite_code
BEFORE INSERT ON organizations
FOR EACH ROW
EXECUTE FUNCTION set_invite_code();

-- Backfill for existing organizations (if any)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT id FROM organizations WHERE invite_code IS NULL LOOP
        UPDATE organizations 
        SET invite_code = 'HF-' || generate_invite_code()
        WHERE id = r.id;
    END LOOP;
END $$;
