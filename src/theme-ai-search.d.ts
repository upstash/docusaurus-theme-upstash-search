/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

declare module '@upstash/docusaurus-theme-upstash-search' {
  import type {DeepPartial} from 'utility-types';

  type ThemeConfigUpstash = {
    enableAiChat: boolean;
    aiChatApiEndpoint: string;
    upstashSearchRestUrl: string;
    upstashSearchReadOnlyRestToken: string;
    upstashSearchIndexName: string;
  };

  export type ThemeConfig = {
    upstash: ThemeConfigUpstash;
  };

  export type UserThemeConfig = DeepPartial<ThemeConfig>;
}

declare module '@upstash/docusaurus-theme-upstash-search/client' {
  import type {ThemeConfig} from '@upstash/docusaurus-theme-upstash-search';

  export function useUpstashThemeConfig(): ThemeConfig;
}

declare module '@theme/AiSearchBar' {
  import type {ReactNode} from 'react';

  export default function SearchBar(): ReactNode;
}
