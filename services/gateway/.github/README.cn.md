<div align="center">
<img src="/docs/images/gateway-border.png" width=350>

<p align="right">
<a href="./README.md">English</a>|<strong>中文</strong> 
</p>

# AI Gateway

### 通过一个快速友好的API链接超过100个大型语言模型。

[![License](https://img.shields.io/github/license/Ileriayo/markdown-badges)](./LICENSE)
[![Discord](https://img.shields.io/discord/1143393887742861333)](https://portkey.ai/community)
[![Twitter](https://img.shields.io/twitter/url/https/twitter/follow/portkeyai?style=social&label=Follow%20%40PortkeyAI)](https://twitter.com/portkeyai)
[![npm version](https://badge.fury.io/js/%40portkey-ai%2Fgateway.svg)](https://www.npmjs.com/package/@portkey-ai/gateway)
<!-- ![example workflow](https://github.com/github/docs/actions/workflows/main.yml/badge.svg) -->

</div>
<br><br>

[Portkey的AI网关](https://portkey.ai/features/ai-gateway) 是您的应用程序与托管的大型语言模型(LLMs)之间的接口。它通过统一的API简化了对OpenAI、Anthropic、Mistral、LLama2、Anyscale、Google Gemini等的API请求。

✅ 极速响应（快9.9倍），占用空间极小（安装后约45kb）<br>✅ 跨多个模型、提供商和密钥进行**负载均衡**<br>✅ 通过**备用方案**确保应用程序的稳定性<br>✅ 默认提供具有指数级备用方案的**自动重试**<br>✅ 根据需要插入中间件<br>✅ 经过超过**1000亿令牌**的实战测试<br> <br>

## 入门指南

### 安装

如果您熟悉Node.js和`npx`，您可以在本地运行您的私有AI网关。([其它部署选项](#deploying-ai-gateway))

```
npx @portkey-ai/gateway
```

> 您的AI网关现在运行在 [http://localhost:8787](http://localhost:8787/) 🚀 <br>

### 使用方法

让我们尝试通过AI网关向OpenAI发起一个**聊天**请求：

```
bashCopy codecurl '127.0.0.1:8787/v1/chat/completions' \
  -H 'x-portkey-provider: openai' \
  -H "Authorization: Bearer $OPENAI_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"messages": [{"role": "user","content": "Say this is test."}], "max_tokens": 20, "model": "gpt-4"}'
```

[支持的SDK完整列表](#supported-sdks)

<br>


## 支持的AI厂商

|| AI厂商 | 支持 | 流式 | 支持的端点 |
|---|---|---|---|--|
| <img src="docs/images/openai.png" width=25 />| OpenAI | ✅  |✅  | `/completions`, `/chat/completions`,`/embeddings`, `/assistants`, `/threads`, `/runs` |
| <img src="docs/images/azure.png" width=25>| Azure OpenAI | ✅  |✅  | `/completions`, `/chat/completions`,`/embeddings` |
| <img src="docs/images/anyscale.png" width=25>| Anyscale | ✅   | ✅  | `/chat/completions` |
| <img src="https://upload.wikimedia.org/wikipedia/commons/2/2d/Google-favicon-2015.png" width=25>| Google Gemini & Palm | ✅  |✅  | `/generateMessage`, `/generateText`, `/embedText` |
| <img src="docs/images/anthropic.png" width=25>| Anthropic  | ✅  |✅  | `/messages`, `/complete` |
| <img src="docs/images/cohere.png" width=25>| Cohere  | ✅  |✅  | `/generate`, `/embed`, `/rerank` |
| <img src="https://assets-global.website-files.com/64f6f2c0e3f4c5a91c1e823a/654693d569494912cfc0c0d4_favicon.svg" width=25>| Together AI  | ✅  |✅  | `/chat/completions`, `/completions`, `/inference` |
| <img src="https://www.perplexity.ai/favicon.svg" width=25>| Perplexity  | ✅  |✅  | `/chat/completions` |
| <img src="https://docs.mistral.ai/img/favicon.ico" width=25>| Mistral  | ✅  |✅  | `/chat/completions`, `/embeddings` |

> [在这里查看支持的100多个模型的完整列表](https://portkey.ai/docs/welcome/what-is-portkey#ai-providers-supported)
<br />

## 特点

<table>
  <tr>
    <td>
      <h4><a href="https://portkey.ai/docs/product/ai-gateway-streamline-llm-integrations/universal-api">统一API签名</a></h4>
      使用OpenAI的API签名连接100多个LLM。AI网关处理请求、响应和错误转换，因此您无需对代码进行任何更改。您可以使用OpenAI SDK本身连接到任何支持的LLM。
      <br><br>
      <img src="docs/images/openai.png" height=40 />&nbsp;&nbsp;&nbsp;<img src="docs/images/azure.png" height=40 />&nbsp;&nbsp;&nbsp;
      <img src="docs/images/anyscale.png" height=40 />&nbsp;&nbsp;&nbsp;
      <img src="https://upload.wikimedia.org/wikipedia/commons/2/2d/Google-favicon-2015.png" height=40 />&nbsp;&nbsp;&nbsp;<br><br>
      <img src="docs/images/anthropic.png" height=40 />&nbsp;&nbsp;&nbsp;
      <img src="docs/images/cohere.png" height=40 />&nbsp;&nbsp;&nbsp;
      <img src="https://assets-global.website-files.com/64f6f2c0e3f4c5a91c1e823a/654693d569494912cfc0c0d4_favicon.svg" height=40 />&nbsp;&nbsp;&nbsp;<br><br>
      <img src="https://www.perplexity.ai/favicon.svg" height=40 />&nbsp;&nbsp;&nbsp;
      <img src="https://docs.mistral.ai/img/favicon.ico" height=40 />&nbsp;&nbsp;&nbsp;
      <img src="https://1000logos.net/wp-content/uploads/2021/10/logo-Meta.png" height=40 />
     <br><br>
    </td>
    <td>
      <h4><a href="https://portkey.ai/docs/product/ai-gateway-streamline-llm-integrations/fallbacks">备用方案</a></h4>
      不要让失败阻止您。备用功能允许您按优先顺序指定语言模型API（LLMs）列表。如果主LLM无法响应或遇到错误，Portkey将自动备用到列表中的下一个LLM，确保您的应用程序的稳定性和可靠性。
      <br><br>
      <img src="https://framerusercontent.com/images/gmlOW8yeKP2pGuIsObM6gKLzeMI.png" height=200 />
    </td>
  </tr>
</table>
<table>
  <tr>
    <td>
      <h4><a href="https://portkey.ai/docs/product/ai-gateway-streamline-llm-integrations/automatic-retries">自动重试</a></h4>
      临时问题不应该意味着手动重新运行。AI网关可以自动重试失败的请求多达5次。我们采用指数退避策略，间隔重试尝试以防止网络过载。
      <br><br>
      <img src="https://github.com/roh26it/Rubeus/assets/971978/8a6e653c-94b2-4ba7-95c7-93544ee476b1" height=200 />
    </td>
    <td>
      <h4><a href="https://portkey.ai/docs/product/ai-gateway-streamline-llm-integrations/load-balancing">负载均衡</a></h4>
      根据自定义权重在多个API密钥或提供商之间有效分配负载。这确保了您的生成式AI应用程序的高可用性和最佳性能，防止任何单一LLM成为性能瓶颈。
      <br><br>
      <img src="https://framerusercontent.com/images/6EWuq3FWhqrPe3kKLqVspevi4.png" height=200 />
    </td>
  </tr>
</table>

<br>

## 配置 AI 网关
AI 网关支持[配置](https://portkey.ai/docs/api-reference/config-object)，以实现如**后备（fallbacks）**、**负载均衡（load balancing）**、**重试（retries）**等多样化的路由策略。
<br><br>
您可以在通过 `x-portkey-config` 头部进行 OpenAI 调用时使用这些配置
```js
// 使用 OpenAI JS SDK
const client = new OpenAI({
  baseURL: "http://127.0.0.1:8787", // 网关 URL
  defaultHeaders: {
    'x-portkey-config': {.. 你的配置在这里 ..}, 
  }
});
```
<br>
<details><summary>这里有一个示例配置，在回退到 Gemini Pro 之前会重试 OpenAI 请求 5 次</summary>

```js
{
  "retry": { "count": 5 },
  "strategy": { "mode": "fallback" },
  "targets": [{
      "provider": "openai",
      "api_key": "sk-***"
    },{
      "provider": "google",
      "api_key": "gt5***",
      "override_params": {"model": "gemini-pro"}
  }]
}
```
</details> <details> <summary>此配置将使得在 2 个 OpenAI 密钥之间实现等量的负载均衡</summary>

```js
{
  "strategy": { "mode": "loadbalance" },
  "targets": [{
      "provider": "openai",
      "api_key": "sk-***",
      "weight": "0.5"
    },{
      "provider": "openai",
      "api_key": "sk-***",
      "weight": "0.5"
    }
  ]
}
```
</details>
了解更多关于配置对象。
<br>

## 支持的SDKs

| 语言 | 支持的SDKs |
|---|---|
| Node.js / JS / TS | [Portkey SDK](https://www.npmjs.com/package/portkey-ai) <br> [OpenAI SDK](https://www.npmjs.com/package/openai) <br> [LangchainJS](https://www.npmjs.com/package/langchain) <br> [LlamaIndex.TS](https://www.npmjs.com/package/llamaindex) |
| Python | [Portkey SDK](https://pypi.org/project/portkey-ai/) <br> [OpenAI SDK](https://pypi.org/project/openai/) <br> [Langchain](https://pypi.org/project/langchain/) <br> [LlamaIndex](https://pypi.org/project/llama-index/) |
| Go | [go-openai](https://github.com/sashabaranov/go-openai) |
| Java | [openai-java](https://github.com/TheoKanning/openai-java) |
| Rust | [async-openai](https://docs.rs/async-openai/latest/async_openai/) |
| Ruby | [ruby-openai](https://github.com/alexrudall/ruby-openai) |

<br>



## 部署 AI 网关

[查看文档](docs/installation-deployments.md)了解如何在本地安装 AI 网关或者在流行的平台上部署它。

<br>

## 路线图

1. 支持更多的提供商。如果缺少某个提供商或 LLM 平台，请[提出功能请求](https://github.com/Portkey-AI/gateway/issues)。
2. 增强的负载均衡功能，以优化不同模型和提供商之间的资源使用。
3. 更加健壮的后备和重试策略，以进一步提高请求的可靠性。
4. 增加统一 API 签名的可定制性，以满足更多样化的使用案例。

[💬 在这里参与路线图讨论。](https://github.com/Portkey-AI/gateway/projects/)

<br>

## 贡献

最简单的贡献方式是选择任何带有 `good first issue` 标签的问题 💪。在[这里](./CONTRIBUTING.md)阅读贡献指南。

发现 Bug？[在这里提交](https://github.com/Portkey-AI/gateway/issues) | 有功能请求？[在这里提交](https://github.com/Portkey-AI/gateway/issues)

<br>

## 社区

加入我们不断增长的全球社区，寻求帮助，分享想法，讨论 AI。

- 查看我们的官方[博客](https://portkey.ai/blog)
- 在 [Discord](https://portkey.ai/community) 上与我们实时交流
- 在 [Twitter](https://twitter.com/PortkeyAI) 上关注我们
- 在 [LinkedIn](https://www.linkedin.com/company/portkey-ai/) 上与我们建立联系

<!-- - 在 [YouTube](https://www.youtube.com/channel/UCZph50gLNXAh1DpmeX8sBdw) 上访问我们 --> <!-- - 加入我们的 [Dev 社区](https://dev.to/portkeyai) --> <!-- - 在 [Stack Overflow](https://stackoverflow.com/questions/tagged/portkey) 上查看标记为 #portkey 的问题 -->

![Rubeus Social Share (4)](https://github.com/Portkey-AI/gateway/assets/971978/89d6f0af-a95d-4402-b451-14764c40d03f)
