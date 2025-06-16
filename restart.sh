cd ../search-js

bun run build

cd ../docusaurus-theme-ai-search-upstash

npm install @upstash/search@file:../search-js
