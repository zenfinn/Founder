-- Untergruppen-Erstellung deaktivieren (Feature entfernt).

drop policy if exists "subgroups_insert_own" on public.group_subgroups;
