/*
  # Create pets table and storage

  1. New Tables
    - `pets`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `name` (text)
      - `image_url` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `pets` table
    - Add policies for CRUD operations
*/

-- Create the pets table
CREATE TABLE IF NOT EXISTS pets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  name text NOT NULL,
  image_url text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE pets ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view all pets"
  ON pets
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own pets"
  ON pets
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pets"
  ON pets
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pets"
  ON pets
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);