INSERT INTO public.user_roles (user_id, role)
VALUES ('7b132505-9e2b-4a33-b7c7-7306a87f40fb', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;