-- Keep the administrator organization name consistent across admin and community screens.
update public.member_profiles
set display_name = 'Harmony Link',
    updated_at = now()
where role = 'admin';
