CREATE TRIGGER vault_upload AFTER INSERT ON storage.objects FOR EACH ROW EXECUTE FUNCTION supabase_functions.http_request('https://cloud.trigger.dev/api/v1/sources/http/clxhxy07hfixvo93155n4t3bw', 'POST', '{"Content-type":"application/json","Authorization":"Bearer 45fe98e53abae5f592f97432da5d3e388b71bbfe3194aa1c82e02ed83af225e1"}', '{}', '3000');


