set check_function_bodies = off;

CREATE OR REPLACE FUNCTION storage.extension(name text)
 RETURNS text
 LANGUAGE plpgsql
AS $function$
DECLARE
_parts text[];
_filename text;
BEGIN
    select string_to_array(name, '/') into _parts;
    select _parts[array_length(_parts,1)] into _filename;
    -- @todo return the last part instead of 2
    return split_part(_filename, '.', 2);
END
$function$
;

CREATE OR REPLACE FUNCTION storage.filename(name text)
 RETURNS text
 LANGUAGE plpgsql
AS $function$
DECLARE
_parts text[];
BEGIN
    select string_to_array(name, '/') into _parts;
    return _parts[array_length(_parts,1)];
END
$function$
;

CREATE OR REPLACE FUNCTION storage.foldername(name text)
 RETURNS text[]
 LANGUAGE plpgsql
AS $function$
DECLARE
_parts text[];
BEGIN
    select string_to_array(name, '/') into _parts;
    return _parts[1:array_length(_parts,1)-1];
END
$function$
;

create policy "Give members access to team folder 1oj01fe_0"
on "storage"."objects"
as permissive
for select
to public
using (((bucket_id = 'avatars'::text) AND (EXISTS ( SELECT 1
   FROM users_on_team
  WHERE ((users_on_team.user_id = auth.uid()) AND ((users_on_team.team_id)::text = (storage.foldername(objects.name))[1]))))));


create policy "Give members access to team folder 1oj01fe_1"
on "storage"."objects"
as permissive
for insert
to public
with check (((bucket_id = 'avatars'::text) AND (EXISTS ( SELECT 1
   FROM users_on_team
  WHERE ((users_on_team.user_id = auth.uid()) AND ((users_on_team.team_id)::text = (storage.foldername(objects.name))[1]))))));


create policy "Give members access to team folder 1oj01fe_2"
on "storage"."objects"
as permissive
for update
to public
using (((bucket_id = 'avatars'::text) AND (EXISTS ( SELECT 1
   FROM users_on_team
  WHERE ((users_on_team.user_id = auth.uid()) AND ((users_on_team.team_id)::text = (storage.foldername(objects.name))[1]))))));


create policy "Give members access to team folder 1oj01fe_3"
on "storage"."objects"
as permissive
for delete
to public
using (((bucket_id = 'avatars'::text) AND (EXISTS ( SELECT 1
   FROM users_on_team
  WHERE ((users_on_team.user_id = auth.uid()) AND ((users_on_team.team_id)::text = (storage.foldername(objects.name))[1]))))));


create policy "Give members access to team folder 1uo56a_0"
on "storage"."objects"
as permissive
for select
to authenticated
using (((bucket_id = 'vault'::text) AND (EXISTS ( SELECT 1
   FROM users_on_team
  WHERE ((users_on_team.user_id = auth.uid()) AND ((users_on_team.team_id)::text = (storage.foldername(objects.name))[1]))))));


create policy "Give members access to team folder 1uo56a_1"
on "storage"."objects"
as permissive
for insert
to authenticated
with check (((bucket_id = 'vault'::text) AND (EXISTS ( SELECT 1
   FROM users_on_team
  WHERE ((users_on_team.user_id = auth.uid()) AND ((users_on_team.team_id)::text = (storage.foldername(objects.name))[1]))))));


create policy "Give members access to team folder 1uo56a_2"
on "storage"."objects"
as permissive
for update
to authenticated
using (((bucket_id = 'vault'::text) AND (EXISTS ( SELECT 1
   FROM users_on_team
  WHERE ((users_on_team.user_id = auth.uid()) AND ((users_on_team.team_id)::text = (storage.foldername(objects.name))[1]))))));


create policy "Give members access to team folder 1uo56a_3"
on "storage"."objects"
as permissive
for delete
to authenticated
using (((bucket_id = 'vault'::text) AND (EXISTS ( SELECT 1
   FROM users_on_team
  WHERE ((users_on_team.user_id = auth.uid()) AND ((users_on_team.team_id)::text = (storage.foldername(objects.name))[1]))))));


create policy "Give users access to own folder 1oj01fe_0"
on "storage"."objects"
as permissive
for select
to authenticated
using (((bucket_id = 'avatars'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));


create policy "Give users access to own folder 1oj01fe_1"
on "storage"."objects"
as permissive
for insert
to authenticated
with check (((bucket_id = 'avatars'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));


create policy "Give users access to own folder 1oj01fe_2"
on "storage"."objects"
as permissive
for update
to authenticated
using (((bucket_id = 'avatars'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));


create policy "Give users access to own folder 1oj01fe_3"
on "storage"."objects"
as permissive
for delete
to authenticated
using (((bucket_id = 'avatars'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));

