<div align="center">
<img src="/docs/images/gateway-border.png" width=350>

# AI Gateway

### Route to 100+ LLMs with 1 fast & friendly API.

</div>
<br><br>

[Portkey's AI Gateway](https://portkey.ai/features/ai-gateway) is the interface between your app and hosted LLMs. It streamlines API requests to OpenAI, Anthropic, Mistral, LLama2, Anyscale, Google Gemini and more with a unified API.

✅&nbsp; Blazing **fast** (9.9x faster) with a **tiny footprint** (~45kb installed) <br>
✅&nbsp; **Load balance** across multiple models, providers, and keys <br>
✅&nbsp; **Fallbacks** make sure your app stays resilient <br>
✅&nbsp; **Automatic Retries** with exponential fallbacks come by default <br>
✅&nbsp; Plug-in middleware as needed <br>
✅&nbsp; Battle tested over **100B tokens** <br>
<br>

### Deploy on Replit

1. Fork the AI gateway published by Portkey with a preferred name into your Replit account.
2. Click [Run] to run the gateway for your apps.
3. Open a new tab to grab the gateway URL. It typically looks like `https://unique-random-numbers.xxx.repl.co/`
4. Click [Deploy] in the top right for a production-ready app gateway (Requires Replit Core).
5. The gateway will be deployed for production use at `https://chosen-subdomain.replit.app`.

**Example usage**

Let's try making a chat completions call to OpenAI through the AI gateway:

```sh
curl 'https://chosen-subdomain.replit.app/v1/chat/completions' \
  -H 'x-portkey-provider: openai' \
  -H "Authorization: Bearer $OPENAI_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"messages": [{"role": "user","content": "Say this is test."}], "max_tokens": 20, "model": "gpt-4"}'
```

### Portkey

- Read the [AI gateway documentation](https://portkey.ai/docs/product/ai-gateway-streamline-llm-integrations).
- Explore Oberservability Suite to build reliable gen-AI apps for production. [Try Portkey](https://portkey.ai/).
