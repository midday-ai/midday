CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();

CREATE TRIGGER user_registered AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION webhook('webhook/registered');


set check_function_bodies = off;

CREATE OR REPLACE FUNCTION storage.handle_empty_folder_placeholder()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    name_tokens text[];
    modified_name text;
BEGIN
    -- Split the name into an array of tokens based on '/'
    name_tokens := string_to_array(NEW.name, '/');

    -- Check if the last item in name_tokens is '.emptyFolderPlaceholder'
    IF name_tokens[array_length(name_tokens, 1)] = '.emptyFolderPlaceholder' THEN
        
        -- Change the last item to '.folderPlaceholder'
        name_tokens[array_length(name_tokens, 1)] := '.folderPlaceholder';
        
        -- Reassemble the tokens back into a string
        modified_name := array_to_string(name_tokens, '/');

        -- Insert a new row with the modified name
        INSERT INTO storage.objects (bucket_id, name, owner, owner_id, team_id, parent_path)
        VALUES (
            NEW.bucket_id,
            modified_name,
            NEW.owner,
            NEW.owner_id,
            NEW.team_id,
            NEW.parent_path
        );
    END IF;

    -- Insert the original row
    RETURN NEW;
END;
$function$
;

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


CREATE TRIGGER after_insert_objects AFTER INSERT ON storage.objects FOR EACH ROW WHEN ((new.bucket_id = 'vault'::text)) EXECUTE FUNCTION insert_into_documents();

CREATE TRIGGER before_delete_objects BEFORE DELETE ON storage.objects FOR EACH ROW WHEN ((old.bucket_id = 'vault'::text)) EXECUTE FUNCTION delete_from_documents();

CREATE TRIGGER tr_lp225ozlnzx2 AFTER INSERT ON storage.objects FOR EACH ROW EXECUTE FUNCTION supabase_functions.http_request('https://cloud.trigger.dev/api/v1/sources/http/clz0yl7ai6652lp225ozlnzx2', 'POST', '{"Content-type":"application/json", "Authorization": "Bearer d8e3de5a468d1af4990e168c27e2b167e6911e93da67a7a8c9cf15b1dc2011dd" }', '{}', '1000');

CREATE TRIGGER vault_upload AFTER INSERT ON storage.objects FOR EACH ROW EXECUTE FUNCTION supabase_functions.http_request('https://cloud.trigger.dev/api/v1/sources/http/clxhxy07hfixvo93155n4t3bw', 'POST', '{"Content-type":"application/json","Authorization":"Bearer 45fe98e53abae5f592f97432da5d3e388b71bbfe3194aa1c82e02ed83af225e1"}', '{}', '3000');


