CREATE OR REPLACE FUNCTION public.get_public_result_sitemap_entries()
RETURNS TABLE (
  share_id text,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT pr.share_id, pr.created_at
  FROM public.public_results pr
  WHERE pr.share_id IS NOT NULL
  ORDER BY pr.created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_result_sitemap_entries() TO anon, authenticated;