/*
  # HealthGuardian Database Schema

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key, references auth.users)
      - `email` (text, unique)
      - `full_name` (text)
      - `avatar_url` (text, optional)
      - `subscription_status` (text, default 'free')
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `health_records`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `full_name` (text)
      - `blood_type` (text)
      - `allergies` (text array)
      - `medications` (text array)
      - `medical_conditions` (text array)
      - `emergency_contacts` (jsonb)
      - `data_hash` (text)
      - `algorand_tx_id` (text, optional)
      - `qr_code_id` (text, unique)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `health_documents`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `filename` (text)
      - `file_path` (text)
      - `document_hash` (text)
      - `verification_status` (text, default 'pending')
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Add policy for public emergency access to health records
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  avatar_url text,
  subscription_status text DEFAULT 'free' CHECK (subscription_status IN ('free', 'premium')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create health_records table
CREATE TABLE IF NOT EXISTS health_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  full_name text NOT NULL,
  blood_type text,
  allergies text[] DEFAULT '{}',
  medications text[] DEFAULT '{}',
  medical_conditions text[] DEFAULT '{}',
  emergency_contacts jsonb DEFAULT '[]',
  data_hash text NOT NULL,
  algorand_tx_id text,
  qr_code_id text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create health_documents table
CREATE TABLE IF NOT EXISTS health_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  filename text NOT NULL,
  file_path text NOT NULL,
  document_hash text NOT NULL,
  verification_status text DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'unverified')),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_documents ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Health records policies
CREATE POLICY "Users can manage own health records"
  ON health_records FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Public emergency access to health records"
  ON health_records FOR SELECT
  TO anon
  USING (true);

-- Health documents policies
CREATE POLICY "Users can manage own health documents"
  ON health_documents FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_health_records_updated_at
  BEFORE UPDATE ON health_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_health_records_user_id ON health_records(user_id);
CREATE INDEX IF NOT EXISTS idx_health_records_qr_code_id ON health_records(qr_code_id);
CREATE INDEX IF NOT EXISTS idx_health_documents_user_id ON health_documents(user_id);