-- Add first_seen_date column to user_services table to track actual signup date
ALTER TABLE public.user_services 
ADD COLUMN first_seen_date timestamp with time zone;