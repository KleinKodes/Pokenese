'use client';

import {
  useState,
  useCallback,
  useRef,
  useEffect,
  KeyboardEvent,
} from 'react';
import { motion } from 'framer-motion';
import { Search, Send } from 'lucide-react';
import Image from 'next/image';
import { PokemonType } from '../../types/pokemon';
import { searchPokemon } from '../../lib/pokemon';
import { clsx } from 'clsx';

interface GuessInputProps {
  onGuess: (guess: string) => void;
  guessedIds: number[];
  isDisabled: boolean;
  isWrongGuess: boolean;
  allPokemon: PokemonType[];
}

export function GuessInput({
  onGuess,
  guessedIds,
  isDisabled,
  isWrongGuess,
  allPokemon,
}: GuessInputProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<PokemonType[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const updateSuggestions = useCallback(
    (value: string) => {
      if (!value.trim()) {
        setSuggestions([]);
        setIsOpen(false);
        return;
      }
      const results = searchPokemon(allPokemon, value, guessedIds, 8);
      setSuggestions(results);
      setIsOpen(results.length > 0);
      setHighlightedIndex(-1);
    },
    [allPokemon, guessedIds]
  );

  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setQuery(value);
      updateSuggestions(value);
    },
    [updateSuggestions]
  );

  const selectSuggestion = useCallback(
    (pokemon: PokemonType) => {
      setQuery('');
      setSuggestions([]);
      setIsOpen(false);
      setHighlightedIndex(-1);
      onGuess(pokemon.name_en);
    },
    [onGuess]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setHighlightedIndex((prev) =>
            prev < suggestions.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setHighlightedIndex((prev) =>
            prev > 0 ? prev - 1 : suggestions.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
            selectSuggestion(suggestions[highlightedIndex]);
          } else if (suggestions.length === 1) {
            selectSuggestion(suggestions[0]);
          }
          break;
        case 'Escape':
          setIsOpen(false);
          setHighlightedIndex(-1);
          break;
      }
    },
    [isOpen, suggestions, highlightedIndex, selectSuggestion]
  );

  const handleSubmitButton = useCallback(() => {
    if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
      selectSuggestion(suggestions[highlightedIndex]);
    } else if (suggestions.length === 1) {
      selectSuggestion(suggestions[0]);
    } else if (query.trim()) {
      // Try exact match
      const exact = allPokemon.find(
        (p) => p.name_en.toLowerCase() === query.trim().toLowerCase()
      );
      if (exact) selectSuggestion(exact);
    }
  }, [highlightedIndex, suggestions, query, allPokemon, selectSuggestion]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const item = listRef.current.children[highlightedIndex] as HTMLElement;
      item?.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightedIndex]);

  return (
    <motion.div
      animate={isWrongGuess ? { x: [0, -6, 6, -4, 4, -2, 2, 0] } : { x: 0 }}
      transition={{ duration: 0.4 }}
      className="relative w-full"
    >
      <div className="flex gap-2">
        {/* Input + dropdown */}
        <div ref={containerRef} className="relative flex-1">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
              aria-hidden="true"
            />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                if (query) updateSuggestions(query);
              }}
              disabled={isDisabled}
              placeholder="Guess Pokémon name..."
              autoComplete="off"
              aria-autocomplete="list"
              aria-controls={isOpen ? 'guess-suggestions' : undefined}
              aria-activedescendant={
                highlightedIndex >= 0
                  ? `suggestion-${highlightedIndex}`
                  : undefined
              }
              className={clsx(
                'w-full pl-10 pr-4 py-3 rounded-xl border bg-bg-input text-text-primary placeholder:text-text-muted transition-all duration-250 focus:outline-none focus:border-border-focus focus:ring-1 focus:ring-border-focus disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px]',
                isWrongGuess
                  ? 'border-color-error'
                  : 'border-border-default'
              )}
            />
          </div>

          {/* Dropdown */}
          {isOpen && (
            <ul
              id="guess-suggestions"
              ref={listRef}
              role="listbox"
              aria-label="Pokémon suggestions"
              className="absolute bottom-full mb-2 left-0 right-0 bg-bg-elevated border border-border-default rounded-xl overflow-hidden shadow-card z-40 max-h-72 overflow-y-auto"
            >
              {suggestions.map((pokemon, i) => (
                <li
                  key={pokemon.id}
                  id={`suggestion-${i}`}
                  role="option"
                  aria-selected={i === highlightedIndex}
                  onClick={() => selectSuggestion(pokemon)}
                  className={clsx(
                    'flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors min-h-[52px]',
                    i === highlightedIndex
                      ? 'bg-bg-surface text-text-primary'
                      : 'text-text-secondary hover:bg-bg-surface hover:text-text-primary'
                  )}
                >
                  <Image
                    src={pokemon.sprite_url}
                    alt={pokemon.name_en}
                    width={36}
                    height={36}
                    className="w-9 h-9 object-contain"
                    unoptimized
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">
                      {highlightQuery(pokemon.name_en, query)}
                    </div>
                  </div>
                  <span className="text-xs text-text-muted font-mono">
                    #{String(pokemon.id).padStart(3, '0')}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Submit button */}
        <button
          onClick={handleSubmitButton}
          disabled={isDisabled || (!query.trim() && suggestions.length === 0)}
          aria-label="Submit guess"
          className="flex items-center justify-center w-12 h-12 rounded-xl bg-accent-red text-white hover:bg-accent-red-hover hover:shadow-glow-red transition-all duration-250 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-border-focus min-h-[48px] min-w-[48px]"
        >
          <Send size={18} />
        </button>
      </div>
    </motion.div>
  );
}

function highlightQuery(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-transparent text-accent-gold font-bold">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}
