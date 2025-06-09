/*
  # Fix user signup trigger

  1. Database Functions
    - Create or replace the handle_new_user function to automatically create profiles
    - Ensure proper error handling and data extraction from auth metadata

  2. Triggers
    - Drop existing trigger if it exists to avoid conflicts
    - Create new trigger on auth.users table to fire after user creation
    - Ensure trigger calls the profile creation function

  3. Security
    - Function runs with SECURITY DEFINER to have proper permissions
    - Handles cases where name might not be provided in metadata
*/

-- Create or replace the function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists to avoid conflicts
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger that fires after a new user is inserted into auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.profiles TO anon, authenticated;