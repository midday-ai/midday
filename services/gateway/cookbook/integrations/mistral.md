# Portkey + Mistral
Portkey helps bring Mistral's APIs to production with its observability suite & AI Gateway. Use the Mistral API **through** Portkey for:
1. **Enhanced Logging**: Track API usage with detailed insights and custom segmentation.
2. **Production Reliability**: Automated fallbacks, load balancing, retries, time outs, and caching.
3. **Continuous Improvement**: Collect and apply user feedback.

### 1.1 Setup & Logging
1. Obtain your [**Portkey API Key**](https://app.portkey.ai/).
2. Set `$ export PORTKEY_API_KEY=PORTKEY_API_KEY`
3. Set `$ export MISTRAL_API_KEY=MISTRAL_API_KEY`
4. `pip install portkey-ai` or `npm i portkey-ai`

```py
""" OPENAI PYTHON SDK """
from portkey_ai import Portkey

portkey = Portkey(
    api_key="PORTKEY_API_KEY",
    # ************************************
    provider="mistral-ai",
    Authorization="Bearer MISTRAL_API_KEY"
    # ************************************
)

response = portkey.chat.completions.create(
    model="mistral-tiny",
    messages = [{ "role": "user", "content": "c'est la vie" }]
)
```

```javascript
import Portkey from 'portkey-ai';

const portkey = new Portkey({
    apiKey: "PORTKEY_API_KEY",
    // ***********************************
    provider: "mistral-ai",
    Authorization: "Bearer MISTRAL_API_KEH"
    // ***********************************
})

async function main(){
  const response = await portkey.chat.completions.create({
      model: "mistral-tiny",
      messages: [{ role: 'user', content: "c'est la vie" }]
  });
}

main()
```

### 1.2. Enhanced Observability
* **Trace** requests with single id.
* **Append custom tags** for request segmenting & in-depth analysis.

Just add their relevant headers to your reuqest:

```py
from portkey_ai import Portkey

portkey = Portkey(
    api_key="PORTKEY_API_KEY",
    provider="mistral-ai",
    Authorization="Bearer MISTRAL_API_KEY"
)

response = portkey.with_options(
    # ************************************
    trace_id="ux5a7",
    metadata={"user": "john_doe"}
    # ************************************
).chat.completions.create(
    model="mistral-tiny",
    messages = [{ "role": "user", "content": "c'est la vie" }]
)
```

```javascript
import Portkey from 'portkey-ai';

const portkey = new Portkey({
    apiKey: "PORTKEY_API_KEY",
    provider: "mistral-ai",
    Authorization: "Bearer MISTRAL_API_KEH"
})

async function main(){
  const response = await portkey.chat.completions.create({
      model: "mistral-tiny",
      messages: [{ role: 'user', content: "c'est la vie" }]
  },{
    // ***********************************
    traceID: "ux5a7",
    metadata: {"user": "john_doe"}
});
}

main()
```

Here’s how your logs will appear on your Portkey dashboard:

<img src="https://portkey.ai/blog/content/images/2023/11/logsgif.gif" />

### 2. Caching, Fallbacks, Load Balancing
* **Fallbacks**: Ensure your application remains functional even if a primary service fails.
* **Load Balancing**: Efficiently distribute incoming requests among multiple models.
* **Semantic Caching**: Reduce costs and latency by intelligently caching results.

Toggle these features by saving _Configs_ (from the Portkey dashboard > Configs tab).

If we want to enable semantic caching + fallback from Mistral-Medium to Mistral-Tiny, your Portkey config would look like this:
```json
{
	"cache": {"mode": "semantic"},
	"strategy": {"mode": "fallback"},
	"targets": [
		{
			"provider": "mistral-ai", "api_key": "...",
			"override_params": {"model": "mistral-medium"}
		},
		{
			"provider": "mistral-ai", "api_key": "...",
			"override_params": {"model": "mistral-tiny"}
		}
	]
}
```

Now, just set the Config ID while instantiating Portkey:

```py
""" OPENAI PYTHON SDK """
from portkey_ai import Portkey

portkey = Portkey(
    api_key="PORTKEY_API_KEY",
    # ************************************
    config="pp-mistral-cache-xx"
    # ************************************
)

response = portkey.chat.completions.create(
    model="mistral-tiny",
    messages = [{ "role": "user", "content": "c'est la vie" }]
)
```

```javascript
import Portkey from 'portkey-ai';

const portkey = new Portkey({
    apiKey: "PORTKEY_API_KEY",
    // ***********************************
    config: "pp-mistral-cache-xx"
    // ***********************************
})

async function main(){
  const response = await portkey.chat.completions.create({
      model: "mistral-tiny",
      messages: [{ role: 'user', content: "c'est la vie" }]
  });
}

main()
```

For more on Configs and other gateway feature like Load Balancing, [check out the docs.](https://portkey.ai/docs/product/ai-gateway-streamline-llm-integrations)

### 3. Collect Feedback
Gather weighted feedback from users and improve your app:

```py
from portkey import Portkey

portkey = Portkey(
    api_key="PORTKEY_API_KEY"
)

def send_feedback():
    portkey.feedback.create(
        'trace_id'= 'REQUEST_TRACE_ID',
        'value'= 0  # For thumbs down
    )

send_feedback()
```

```javascript
import Portkey from 'portkey-ai';

const portkey = new Portkey({
    apiKey: "PORTKEY_API_KEY"
});

const sendFeedback = async () => {
    await portkey.feedback.create({
        traceID: "REQUEST_TRACE_ID",
        value: 1  // For thumbs up
    });
}
await sendFeedback();
```

#### Conclusion

Integrating Portkey with Mistral helps you build resilient LLM apps from the get-go. With features like semantic caching, observability, load balancing, feedback, and fallbacks, you can ensure optimal performance and continuous improvement.

[Read full Portkey docs here.](https://portkey.ai/docs/) | [Reach out to the Portkey team.](https://discord.gg/sDk9JaNfK8)
