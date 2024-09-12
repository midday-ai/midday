# Smart Fallback with Model-Optimized Prompts

Portkey can help you easily create fallbacks from one LLM to another, making your application more reliable. While Fallback ensures reliability, it also means that you'll be running a prompt optimized for one LLM on another, which can often lead to significant differences in the final output.

Using Portkey Prompt templates you can optimize for specific models and ensure the final output is best optimised for the use-case, even if there are different models (in the fallback chain).

In this cookbook, we will explore setting up fallbacks between model-optimized prompt templates instead of using the same prompt for different models.

Let’s get started

## 1. Import and Authenticate Portkey SDK

Start by importing Portkey SDK into your NodeJS project using npm and authenticate by passing the Portkey API Key.

```js
import { Portkey } from 'portkey-ai';

const portkey = new Portkey({
  apiKey: process.env.PORTKEYAI_API_KEY,
});
```

You are now ready to access methods on `portkey` instance to trigger a prompt completions API.

## 2. The Limitation with the Traditional Fallbacks

Prepare the prompt for the task you want the model to do. We want our model to split a goal into actionable steps for the cookbook. The good version I was able to come up with `GPT`4 was with the following prompt with **default** model parameters (based on satisfactory response in the playground):

```md
You are a productivity expert. When given a task, you can smartly suggest possible subtasks. You list the subtasks in less than 10 items, keeping each as actionable.
```

<table>
  <tr>
   <td rowspan="2" >System:
<p>
You are a productivity expert. When given a task, you can smartly suggest possible subtasks. You list the subtasks in less than 10 items, keeping each short and actionable.
<p>
User:
<p>
The following is the goal I want to achieve:
<p>
I want to become fit in 6 months
   </td>
   <td rowspan="2" >GPT4:
<p>
1. Visit a doctor for a health check-up.
<p>
2. Set specific fitness goals (like weight loss, strength, etc).
<p>
...
<p>
9. Stay hydrated and make adjustments as required.
   </td>
   <td rowspan="2" >Claude:
<p>
Here are some suggested subtasks to help you achieve six-pack abs in six months:
<p>
1. Develop a balanced and nutritious meal plan that focuses on lean proteins, vegetables, and healthy fats while limiting processed foods and sugary drinks.
<p>
2. Create a sustainable calorie deficit by tracking your daily food intake and ensuring you burn more calories than you consume.
<p>
...
<p>
9. Stay motivated by setting short-term goals, rewarding yourself for progress, and seeking support from friends, family, or a fitness coach.
   </td>
  </tr>
  <tr>
  </tr>
</table>

This means the prompt that got the satisfactory output from GPT4 may not fetch optimum quality with Claude. From the above example, Claude’s response is a bit more elaborate than what we wanted—short and actionable.

We will solve this problem with model optimised prompt templates.

## 3. Create Model-Optimised Prompt Templates

Using Portkey Prompt Templates, you can write your prompt and instructions in one place and then just input the variables when making a call rather than passing the whole instruction again.

To create a prompt template:

1. Login into Portkey Dashboard
2. Navigate to **Prompts**
   1. Click **Create** to open prompt creation page

The following page should open:

![alt text](./images/smart-fallback-with-model-optimized-prompts/1-smart-fallback-with-model-optimized-prompts.png)

I am using Anthopic’s `claude-3-opus-20240229` model to instruct it to generate sub-tasks for an user’s goal. You can declare an variable using moustache syntax to substitute an value when prompt is triggered. For example, `{{goal}}` is substituted with “I want to earn six packs in six months” in the playground.

Now, create another prompt template that can act as a fallback.

![alt text](./images/smart-fallback-with-model-optimized-prompts/2-smart-fallback-with-model-optimized-prompts.png)

You can create the same prompt this time but use a different model, such as `gpt-4`. You have created two prompt templates by now. You must have noticed each prompt has a slightly different `system` message based on the model. After experimenting with each model, the above prompt was best suited for suggesting actionable steps to reach the goal.

The models on this page require you to save OpenAI and Anthropic API keys to the Portkey Vault. For more information about Portkey Vault, [read more on Virtual Keys](https://portkey.ai/docs/product/ai-gateway-streamline-llm-integrations/virtual-keys#creating-virtual-keys).

For further exploration, [Try learning about OpenAI SDK to work with Prompt Templates](../ai-gateway/).

## Fallback Configs using Prompt Templates

You need to prepare requests to apply fallback strategy. To do that, use the created prompt templates earlier, one with Anthropic and another with OpenAI, structure them as follows:

```json
{
  "strategy": {
    "mode": "fallback"
  },
  "targets": [
    {
      "prompt_id": "task_to_subtasks_anthropic"
    },
    {
      "prompt_id": "task_to_subtasks_openai"
    }
  ]
}
```

The `targets` is an array of objects ordered by preference in favor of _Anthropic_ and then on to _OpenAI_.

Pass these `config`s at instance creation from Portkey

```js
const portkey = new Portkey({
  apiKey: PORTKEY_API_KEY,
  config: {
    strategy: {
      mode: 'fallback',
    },
    targets: [
      {
        prompt_id: 'task_to_subtasks_anthropic',
      },
      {
        prompt_id: 'task_to_subtasks_openai',
      },
    ],
  },
});
```

With this step done, moving forward the methods on `portkey` will have the context of above gateway configs for every request sent through portkey.

Read more about different [ways to work with Gateway Configs](../product/101-portkey-gateway-configs.md).

## Trigger Prompt Completions to Activate Smart Fallbacks

The prompt templates are prepared to be triggered while the Portkey client SDK waits to trigger the prompt completions API.

```js
const response = await portkey.prompts.completions.create({
  promptID: 'pp-test-811461',
  variables: { goal: 'I want to acquire an AI engineering skills' },
});

console.log(response.choices[0].message.content); // success
```

The `promptID` invokes the prompt template you want to trigger on a prompt completions API. Since we already pass the gateway configs as an argument to the `configs` parameter during client instance creation, the value against the `promptID` is ignored, and `task_to_subtasks_anthropic` will be treated as the first target where requests will routed to, then fallback to `task_to_subtasks_openai` as defined in the `targets`.

Notice how `variables` hold the information to be substituted in the prompt templates at runtime. Also, even when the `promptID` is valid, the gateway configs will be respected in precedence.

See the [reference](https://portkey.ai/docs/api-reference/prompts/prompt-completion) to learn more.

## View Fallback status in the Logs

Portkey provides the **Logs** to inspect and monitor all the requests seamlessly. It provides valuable information about each request from date/time, model, request, response, etc.

Here is a screenshot of a log:

![alt text](./images/smart-fallback-with-model-optimized-prompts/3-smart-fallback-with-model-optimized-prompts.png)

[Refer to the Logs documentation](https://portkey.ai/docs/product/observability-modern-monitoring-for-llms/logs).

Great job! You learned how to create prompt templates in Portkey and set up fallbacks for thousands of requests from your app, all with just a few lines of code.

## Bonus: Activate Loadbalancing

Loadbalancing can split the volume of requests to both prompts separately, respecting the `weight`s. As an outcome, you have fewer chances of hitting the rate limits and not overwhelming the models.

Here is how you can update the gateway configs:

```js
const portkey = new Portkey({
  apiKey: PORTKEY_API_KEY,
  config: {
    strategy: {
      mode: 'loadbalance',
    },
    targets: [
      {
        prompt_id: 'task_to_subtasks_anthropic',
        weight: 0.1,
      },
      {
        prompt_id: 'task_to_subtasks_openai',
        weight: 0.9,
      },
    ],
  },
});
```

The weights will split the traffic of 90% to OpenAI and 10% to Anthropic prompt templates.

Great job! You learned how to create prompt templates in Portkey and set up fallbacks and load balancing for thousands of requests from your app, all with just a few lines of code.

Happy Coding!

See the full code:

```js
import { Portkey } from 'portkey-ai';

const PORTKEY_API_KEY = 'xssxxrk';

const portkey = new Portkey({
  apiKey: PORTKEY_API_KEY,
  config: {
    strategy: {
      mode: 'fallback',
    },
    targets: [
      {
        prompt_id: 'pp-task-to-su-72fbbb',
      },
      {
        prompt_id: 'pp-task-to-su-051f65',
      },
    ],
  },
});

const response = await portkey.prompts.completions.create({
  promptID: 'pp-test-811461',
  variables: { goal: 'I want to acquire an AI engineering skills' },
});

console.log(response.choices[0].message.content);
```
