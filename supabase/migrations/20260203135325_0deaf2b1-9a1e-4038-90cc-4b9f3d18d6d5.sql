-- Add foreign key from messages to profiles for the join query
ALTER TABLE public.messages 
ADD CONSTRAINT messages_user_id_profiles_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.profiles(user_id) 
ON DELETE CASCADE;