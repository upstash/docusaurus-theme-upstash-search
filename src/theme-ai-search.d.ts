/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

declare module '@upstash/docusaurus-theme-ai-search' {
  import type {DeepPartial} from 'utility-types';

  type ThemeConfigUpstash = {
    enableAiChat: boolean;
    aiChatApiEndpoint: string;
    upstashSearchRestUrl: string;
    upstashSearchReadOnlyRestToken: string;
    upstashSearchIndexNamespace: string;
  };

  export type ThemeConfig = {
    upstash: ThemeConfigUpstash;
  };

  export type UserThemeConfig = DeepPartial<ThemeConfig>;
}

declare module '@upstash/docusaurus-theme-ai-search/client' {
  import type {ThemeConfig} from '@upstash/docusaurus-theme-ai-search';

  export function useUpstashThemeConfig(): ThemeConfig;
}

declare module '@theme/AiSearchBar' {
  import type {ReactNode} from 'react';

  export default function SearchBar(): ReactNode;
}
