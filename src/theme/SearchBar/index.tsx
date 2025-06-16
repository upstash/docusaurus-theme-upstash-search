import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  Suspense,
} from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import type { DocusaurusContext } from '@docusaurus/types';
import type { ThemeConfig } from '@upstash/docusaurus-theme-ai-search';
import { useHistory } from '@docusaurus/router';
import BrowserOnly from '@docusaurus/BrowserOnly';
import styles from './styles.module.css';

// Lazy loaded components
const ReactMarkdown = React.lazy(() => import('react-markdown'));

// Custom hooks
import { useSearchLogic } from './hooks/useSearchLogic';
import { useAiChat } from './hooks/useAiChat';

// Components
import { SearchIcon, ClearIcon } from './components/Icons';
import { LoadingDots } from './components/LoadingDots';
import { UpstashLogo } from './components/UpstashLogo';

// Types
import { SearchResult } from './types';
import { formatContent } from './utils/formatContent';

const SearchBarContent: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchResultsRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const history = useHistory();
  const { siteConfig } = useDocusaurusContext() as DocusaurusContext;
  const themeConfig = siteConfig.themeConfig as ThemeConfig;

  const {
    searchQuery,
    setSearchQuery,
    searchResults,
    isLoading,
    error,
    setSearchResults,
    setError,
  } = useSearchLogic();

  const { aiResponse, isAiLoading, setAiResponse, handleAiQuestion } =
    useAiChat({
      aiChatApiEndpoint: themeConfig.upstash?.aiChatApiEndpoint ?? '',
    });

  const enableAiChat = themeConfig.upstash?.enableAiChat ?? false;

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
    setAiResponse(null);
    setError(null);
  }, [setSearchQuery, setSearchResults, setAiResponse, setError]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.key === 'Escape' || (e.key === 'k' && (e.metaKey || e.ctrlKey))) &&
        isModalOpen
      ) {
        e.preventDefault();
        setIsModalOpen(false);
        clearSearch();
      }
      if (e.key === 'k' && (e.metaKey || e.ctrlKey) && !isModalOpen) {
        e.preventDefault();
        setIsModalOpen(true);
        setTimeout(() => searchInputRef.current?.focus(), 100);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, clearSearch]);

  useEffect(() => {
    setAiResponse(null);
  }, [searchQuery, setAiResponse]);

  const handleResultClick = useCallback(
    (result: SearchResult) => {
      history.push('/' + result.id);
      setIsModalOpen(false);
      clearSearch();
    },
    [history, clearSearch]
  );

  const handleAiQuestionClick = useCallback(
    async (question: string) => {
      if (!isAiLoading && !aiResponse) {
        try {
          await handleAiQuestion(
            question,
            searchResults.map((result) => ({
              content: result.data,
              metadata: result.metadata,
            }))
          );
        } catch (error) {
          setError(
            error instanceof Error ? error.message : 'Failed to get AI response'
          );
        }
      }
    },
    [isAiLoading, aiResponse, handleAiQuestion, searchResults, setError]
  );

  return (
    <div className={styles.searchContainer}>
      <button
        className={styles.searchButton}
        onClick={() => setIsModalOpen(true)}
        aria-label="Search"
      >
        <SearchIcon />
        <span className={styles.searchButtonText}>Search</span>
        <span className={styles.searchShortcut}>⌘K</span>
      </button>

      {isModalOpen && (
        <div
          className={styles.modalOverlay}
          onClick={() => {
            setIsModalOpen(false);
            clearSearch();
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Search documentation"
        >
          <div
            ref={modalRef}
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <form
                className={styles.searchForm}
                onSubmit={(e) => e.preventDefault()}
              >
                <div className={styles.inputWrapper}>
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search documentation..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={styles.searchInput}
                    autoFocus
                    aria-label="Search input"
                  />
                  <div className={styles.inputActions}>
                    {searchQuery && (
                      <button
                        type="button"
                        className={styles.clearButton}
                        onClick={clearSearch}
                        aria-label="Clear search"
                      >
                        <ClearIcon />
                      </button>
                    )}
                    <div className={styles.divider}></div>
                    <button
                      className={styles.closeButton}
                      onClick={() => {
                        setIsModalOpen(false);
                        clearSearch();
                      }}
                      aria-label="Close search"
                    >
                      <span className={styles.escKey}>ESC</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>

            <div ref={searchResultsRef} className={styles.searchResults}>
              {isLoading ? (
                <div className={styles.loadingText}>
                  <LoadingDots text="Loading" />
                </div>
              ) : error ? (
                <div className={styles.error} role="alert">
                  {error}
                </div>
              ) : searchResults.length > 0 ? (
                <>
                  {enableAiChat && (
                    <div
                      className={`${styles.aiSection} ${aiResponse ? styles.aiSectionResponded : ''}`}
                      onClick={() => handleAiQuestionClick(searchQuery)}
                      role="button"
                      tabIndex={0}
                      aria-label="Ask AI about search results"
                    >
                      <div className={styles.aiQueryWrapper}>
                        <div className={styles.aiQueryInfo}>
                          <span className={styles.aiLabel}>AI</span>
                          <div className={styles.aiQueryTextWrapper}>
                            <span className={styles.aiQueryText}>
                              Tell me about{' '}
                              <span className={styles.aiQueryHighlight}>
                                {searchQuery}
                              </span>
                            </span>
                          </div>
                        </div>
                        <span className={styles.aiStatus}>
                          {isAiLoading ? (
                            <LoadingDots />
                          ) : aiResponse ? (
                            'Response →'
                          ) : (
                            'Ask →'
                          )}
                        </span>
                      </div>
                      {aiResponse && (
                        <div className={styles.aiResponseWrapper}>
                          <div className={styles.aiResponse}>
                            <Suspense fallback={<LoadingDots />}>
                              <ReactMarkdown>{aiResponse}</ReactMarkdown>
                            </Suspense>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {searchResults.map((result) => (
                    <div
                      key={result.id}
                      className={styles.searchResultItem}
                      onClick={() => handleResultClick(result)}
                      role="button"
                      tabIndex={0}
                      aria-label={`Search result: ${result.metadata.title}`}
                    >
                      <div className={styles.resultTitle}>
                        <ReactMarkdown>{result.metadata.title}</ReactMarkdown>
                      </div>
                      <div className={styles.resultPath}>
                        {result.metadata.documentTitle}
                      </div>
                      <div className={styles.resultPreview}>
                        {formatContent(result.metadata.content)}
                      </div>
                    </div>
                  ))}
                </>
              ) : searchQuery ? (
                <div className={styles.noResults}>No results found</div>
              ) : (
                <div className={styles.searchResultsPlaceholder}>
                  Start typing to search...
                </div>
              )}
            </div>

            <div className={styles.modalFooter}>
              <div className={styles.poweredBy}>
                <span>Powered by Upstash</span>
                <UpstashLogo className={styles.searchLogo} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const SearchBar = () => {
  return <BrowserOnly>{() => <SearchBarContent />}</BrowserOnly>;
};

export default SearchBar;
