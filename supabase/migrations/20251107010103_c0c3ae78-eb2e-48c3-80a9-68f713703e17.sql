-- Grant admin role to rnocek14@gmail.com
INSERT INTO public.user_roles (user_id, role)
SELECT 'b1254d04-7469-49c2-bbf6-5e689f4d5804'::uuid, 'admin'::app_role
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles 
  WHERE user_id = 'b1254d04-7469-49c2-bbf6-5e689f4d5804' 
  AND role = 'admin'::app_role
);