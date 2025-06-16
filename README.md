# `@upstash/docusaurus-theme-ai-search`

AI-powered search and chat component for Docusaurus using Upstash Search.

## Features

- 🔍 Hybrid search combining sparse and dense embeddings for better results
- 🤖 AI-powered chat responses based on your documentation
- 🎨 Modern and responsive UI
- 🌜 Dark/Light mode support
- 🔒 Secure AI chat communication with CORS protection

## Demo

See it in action with `Jest` documentation [here](https://jest-website-example.netlify.app) or you can watch the demo video that showcases hybrid search and AI chat capabilities.

## Installation

To install the package, run:

```bash
npm install @upstash/docusaurus-theme-ai-search
```

### Enabling the Searchbar

To enable the searchbar, add the following to your docusaurus config file:

```js
export default {
  themes: ['@upstash/docusaurus-theme-ai-search'],
  // ...
  themeConfig: {
    // ...
    upstash: {
      enableAiChat: false, // Set to true to enable AI chat
      upstashSearchRestUrl: "UPSTASH_SEARCH_REST_URL",
      upstashSearchReadOnlyRestToken: "UPSTASH_SEARCH_READ_ONLY_REST_TOKEN",
      upstashSearchIndexNamespace: "UPSTASH_SEARCH_INDEX_NAMESPACE",
    },
  },
};
```

The default index name is `@upstash/docusaurus-theme-ai-search`. You can override it by setting the `upstashSearchIndexNamespace` option.

You can fetch your URL and read only token from [Upstash Console](https://upstash.com/console). **Make sure to use the read only token!**

If you do not have a vector index yet, you can create one from [Upstash Console](https://upstash.com/console). Make sure to use Upstash generated embedding model.

### Indexing Your Docs

To index your documentation, create a `.env` file with the following environment variables and run `npx index-docs-upstash`.

```bash
UPSTASH_SEARCH_REST_URL=
UPSTASH_SEARCH_REST_TOKEN=
UPSTASH_SEARCH_INDEX_NAMESPACE=
DOCS_PATH=
```

You can fetch your URL and token from [Upstash Console](https://upstash.com/console). This time **do not use the read only token** since we are upserting data.

The indexing script looks for documentation in the `docs` directory by default. You can specify a different path using the `DOCS_PATH` option.

The default index namespace is `@upstash/docusaurus-theme-ai-search`. You can override it by setting the `UPSTASH_SEARCH_INDEX_NAMESPACE` option. Make sure the namespace you set while indexing matches with your themeConfig `upstashSearchIndexNamespace` option.

### Setting up AI Chat

To set up AI chat functionality, you'll need to deploy a dedicated API endpoint. You can quickly deploy this endpoint using the following button:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fenesgules%2Fdeploy-ai-chat-api-endpoint&env=OPENAI_API_KEY,ALLOWED_ORIGIN&envDescription=OPENAI_API_KEY%20is%20needed%20to%20generate%20responses%20and%20ALLOWED_ORIGIN%20is%20needed%20to%20only%20accept%20requests%20from%20the%20deployed%20docs%20website.)

This requires setting up the following environment variables while you are deploying the endpoint:

- **OPENAI_API_KEY**: Necessary for generating AI responses.
- **ALLOWED_ORIGIN**: Specifies which origins are allowed to make requests to the deployed endpoint. In this case, setting it to your deployed docs website only allows requests from it.

To enable AI Chat, set the `enableAiChat` option to `true` and set the `aiChatApiEndpoint` option to the URL of your deployed endpoint in your Docusaurus config file.

```js
export default {
  // ...
  themeConfig: {
    // ...
    upstash: {
      enableAiChat: true,
      aiChatApiEndpoint: "https://your-deployed-endpoint-url/api/ask-ai",
    },
  },
};
```
