/*
  # Add storage bucket for pet images

  1. Storage
    - Create 'pets' storage bucket for pet images
    - Enable public access to images
    - Add storage policies for authenticated users

  Note: The pets table and its policies were created in a previous migration.
*/

-- Create storage bucket for pet images
INSERT INTO storage.buckets (id, name, public)
VALUES ('pets', 'pets', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload files to the pets bucket
CREATE POLICY IF NOT EXISTS "Authenticated users can upload pet images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'pets' AND
  auth.uid() = (storage.foldername(name))[1]::uuid
);

-- Allow public access to view pet images
CREATE POLICY IF NOT EXISTS "Public access to view pet images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'pets');

-- Allow users to delete their own pet images
CREATE POLICY IF NOT EXISTS "Users can delete their own pet images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'pets' AND
  auth.uid() = (storage.foldername(name))[1]::uuid
);