
SELECT vault.create_secret('http://localhost:3001/api', 'WEBHOOK_ENDPOINT', 'Webhook endpoint URL');
SELECT vault.create_secret('6c369443-1a88-444e-b459-7e662c1fff9e', 'WEBHOOK_SECRET', 'Webhook secret key');