CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();

CREATE TRIGGER user_registered AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION supabase_functions.http_request('https://app.midday.ai/api/webhook/registered', 'POST', '{"Content-type":"application/json","x-api-key":"szlv1yTFbgV7rmwchh2r3Medq28ZbDMF4QiPKE2Mr5fGADKTl1xTH1vKjxLf2vsj"}', '{}', '1000');


