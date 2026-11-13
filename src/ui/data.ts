import { liveQuery } from 'dexie';
import { createContext } from 'preact';
import { useContext, useEffect, useState } from 'preact/hooks';
import type { Repo } from '../db/repo';

export const RepoContext = createContext<Repo | null>(null);

export function useRepo(): Repo {
  const repo = useContext(RepoContext);
  if (!repo) throw new Error('RepoContext is not provided');
  return repo;
}

/** Runs the query and reruns it whenever the tables it read change. */
export function useLive<T>(
  query: (repo: Repo) => Promise<T>,
  deps: readonly unknown[] = [],
): T | undefined {
  const repo = useRepo();
  const [state, setState] = useState<{ value: T } | undefined>(undefined);
  useEffect(() => {
    const sub = liveQuery(() => query(repo)).subscribe({
      next: (value) => {
        setState({ value });
      },
      error: (e: unknown) => {
        console.error(e);
      },
    });
    return () => {
      sub.unsubscribe();
    };
  }, [repo, ...deps]);
  return state?.value;
}
