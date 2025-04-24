-- SQL script to create storage policies for Supabase buckets
-- This addresses the "new row violates row-level security policy" error

-- Create a function to set up storage policies for a bucket
CREATE OR REPLACE FUNCTION create_storage_policies(bucket_name TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER -- Run with privileges of the function creator
AS $$
DECLARE
  bucket_id UUID;
BEGIN
  -- Get the bucket ID
  SELECT id INTO bucket_id FROM storage.buckets WHERE name = bucket_name;
  
  IF bucket_id IS NULL THEN
    RAISE EXCEPTION 'Bucket % not found', bucket_name;
  END IF;

  -- Drop existing policies if they exist
  BEGIN
    DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;
    DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
    DROP POLICY IF EXISTS "Allow bucket owner full control" ON storage.objects;
    DROP POLICY IF EXISTS "Allow individual object access" ON storage.objects;
  EXCEPTION WHEN OTHERS THEN
    -- Ignore errors when dropping policies that don't exist
  END;

  -- Create policy for public read access to objects in the bucket
  CREATE POLICY "Allow public read access" ON storage.objects
    FOR SELECT
    USING (bucket_id = bucket_id AND (storage.foldername(name))[1] = bucket_name);

  -- Create policy for authenticated users to upload to the bucket
  CREATE POLICY "Allow authenticated uploads" ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = bucket_id AND (storage.foldername(name))[1] = bucket_name);

  -- Create policy for authenticated users to update their own objects
  CREATE POLICY "Allow bucket owner full control" ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (bucket_id = bucket_id AND (storage.foldername(name))[1] = bucket_name AND auth.uid() = owner);

  -- Create policy for authenticated users to delete their own objects
  CREATE POLICY "Allow individual object access" ON storage.objects
    FOR DELETE
    TO authenticated
    USING (bucket_id = bucket_id AND (storage.foldername(name))[1] = bucket_name AND auth.uid() = owner);
END;
$$;

-- Create a function to initialize a bucket with proper permissions
CREATE OR REPLACE FUNCTION initialize_storage_bucket(bucket_name TEXT, is_public BOOLEAN DEFAULT true)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- Run with privileges of the function creator
AS $$
DECLARE
  bucket_id UUID;
BEGIN
  -- Check if bucket exists
  SELECT id INTO bucket_id FROM storage.buckets WHERE name = bucket_name;
  
  -- If bucket doesn't exist, create it
  IF bucket_id IS NULL THEN
    INSERT INTO storage.buckets (name, public, avif_autodetection, file_size_limit, allowed_mime_types)
    VALUES (
      bucket_name,
      is_public,
      false,
      5242880, -- 5MB
      ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']::text[]
    )
    RETURNING id INTO bucket_id;
  END IF;
  
  -- Set up policies for the bucket
  PERFORM create_storage_policies(bucket_name);
  
  RETURN TRUE;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error initializing bucket %: %', bucket_name, SQLERRM;
  RETURN FALSE;
END;
$$;

-- Grant execute permissions on the functions
GRANT EXECUTE ON FUNCTION create_storage_policies TO service_role;
GRANT EXECUTE ON FUNCTION initialize_storage_bucket TO service_role;

-- Comment explaining usage
COMMENT ON FUNCTION create_storage_policies IS 'Creates RLS policies for a storage bucket to allow public read access and authenticated user uploads';
COMMENT ON FUNCTION initialize_storage_bucket IS 'Creates a storage bucket if it doesn''t exist and sets up appropriate RLS policies';