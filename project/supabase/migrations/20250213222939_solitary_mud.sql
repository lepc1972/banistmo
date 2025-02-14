/*
  # Add storage bucket for pet images

  1. Storage
    - Create 'pets' storage bucket for pet images
    - Enable public access to images
    - Add storage policies for authenticated users

  Note: Using DO block to safely create policies without errors if they already exist
*/

-- Create storage bucket for pet images
INSERT INTO storage.buckets (id, name, public)
VALUES ('pets', 'pets', true)
ON CONFLICT (id) DO NOTHING;

-- Safely create policies using DO blocks
DO $$
BEGIN
    -- Upload policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Authenticated users can upload pet images'
    ) THEN
        CREATE POLICY "Authenticated users can upload pet images"
        ON storage.objects
        FOR INSERT
        TO authenticated
        WITH CHECK (
            bucket_id = 'pets' AND
            auth.uid() = (storage.foldername(name))[1]::uuid
        );
    END IF;

    -- View policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Public access to view pet images'
    ) THEN
        CREATE POLICY "Public access to view pet images"
        ON storage.objects
        FOR SELECT
        TO public
        USING (bucket_id = 'pets');
    END IF;

    -- Delete policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Users can delete their own pet images'
    ) THEN
        CREATE POLICY "Users can delete their own pet images"
        ON storage.objects
        FOR DELETE
        TO authenticated
        USING (
            bucket_id = 'pets' AND
            auth.uid() = (storage.foldername(name))[1]::uuid
        );
    END IF;
END $$;