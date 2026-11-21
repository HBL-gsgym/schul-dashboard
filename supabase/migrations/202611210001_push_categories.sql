alter table public.hbl_chat_push_preferences
  add column lessons_enabled boolean not null default true,
  add column calendar_enabled boolean not null default false,
  add column announcements_enabled boolean not null default true;

-- Preferences apply to all dashboard members. Chat delivery checks chat membership separately.
alter policy hbl_chat_push_prefs_insert on public.hbl_chat_push_preferences
  with check (user_id = (select auth.uid()) and exists
    (select 1 from public.hbl_dashboard_members m where m.user_id = (select auth.uid()) and m.enabled));
alter policy hbl_chat_push_prefs_update on public.hbl_chat_push_preferences
  using (user_id = (select auth.uid()) and exists
    (select 1 from public.hbl_dashboard_members m where m.user_id = (select auth.uid()) and m.enabled))
  with check (user_id = (select auth.uid()) and exists
    (select 1 from public.hbl_dashboard_members m where m.user_id = (select auth.uid()) and m.enabled));
