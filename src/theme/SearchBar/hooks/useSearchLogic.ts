import { useState, useCallback, useEffect, useMemo } from 'react';
import { SearchResult } from '../types';
import { useDebounce } from './useDebounce';
import { Search } from '@upstash/search';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import type { ThemeConfig } from '@upstash/docusaurus-theme-upstash-search';
import type { DocusaurusContext } from '@docusaurus/types';

const DEFAULT_INDEX_NAME = 'docusaurus';

export function useSearchLogic() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const { siteConfig } = useDocusaurusContext() as DocusaurusContext;
  const themeConfig = siteConfig.themeConfig as ThemeConfig;
  const themeConfigFields = themeConfig.upstash ?? {};

  const { index, indexName } = useMemo(() => {
    const searchUrl = themeConfigFields.upstashSearchRestUrl;
    const searchToken = themeConfigFields.upstashSearchReadOnlyRestToken;
    const searchNamespace = themeConfigFields.upstashSearchIndexName ?? DEFAULT_INDEX_NAME;

    if (!searchUrl || !searchToken) {
      throw new Error('Upstash Search REST URL and Read-only token are required in themeConfig.upstash');
    }

    const searchClient = new Search({
      url: searchUrl,
      token: searchToken,
    });

    const index = searchClient.index(searchNamespace);

    return {
      index,
      indexName: searchNamespace,
    };
  }, [themeConfigFields]);

  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const results = await index.search({
        query,
        limit: 15,
      });

      setSearchResults(
        results.map((result: any) => ({
          id: String(result.id),
          data: result.data,
          metadata: result.metadata,
        }))
      );
    } catch (error) {
      console.error('Search error:', error);
      setError('An error occurred while searching. Please try again.');
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [index]);

  useEffect(() => {
    performSearch(debouncedSearchQuery);
  }, [debouncedSearchQuery, performSearch]);

  return {
    searchQuery,
    setSearchQuery,
    searchResults,
    isLoading,
    error,
    setSearchResults,
    setError,
  };
}
