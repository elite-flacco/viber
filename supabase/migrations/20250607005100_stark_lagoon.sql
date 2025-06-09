-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create the function to handle new user creation with detailed logging
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  SET search_path = public; -- Add this line
  -- Log the incoming user data for debugging
  RAISE LOG 'handle_new_user called with user_id: %, email: %, metadata: %',
    NEW.id, NEW.email, NEW.raw_user_meta_data;

  BEGIN
    -- Attempt to insert the profile
    INSERT INTO public.profiles (id, email, name)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
    );

    RAISE LOG 'Successfully created profile for user: %', NEW.email;

  EXCEPTION WHEN OTHERS THEN
    -- Log the specific error details
    RAISE LOG 'Error creating profile for user %: SQLSTATE=%, SQLERRM=%',
      NEW.email, SQLSTATE, SQLERRM;

    -- Re-raise the exception to prevent user creation from completing
    RAISE EXCEPTION 'Failed to create user profile: %', SQLERRM;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Set the function owner to postgres for elevated privileges
ALTER FUNCTION public.handle_new_user() OWNER TO postgres;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.profiles TO postgres, anon, authenticated, service_role;

-- Ensure the profiles table has proper permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO postgres;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO service_role;