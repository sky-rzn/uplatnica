import { useEffect, useState } from 'preact/hooks';

export type Route =
  | { name: 'bills' }
  | { name: 'bill'; id: string | null }
  | { name: 'sections' }
  | { name: 'profiles' };

export function parseRoute(hash: string): Route {
  const parts = hash.replace(/^#\/?/, '').split('/');
  switch (parts[0]) {
    case 'sections':
      return { name: 'sections' };
    case 'profiles':
      return { name: 'profiles' };
    case 'bill': {
      const id = parts[1];
      return {
        name: 'bill',
        id: id && id !== 'new' ? decodeURIComponent(id) : null,
      };
    }
    default:
      return { name: 'bills' };
  }
}

export function href(route: Route): string {
  switch (route.name) {
    case 'bill':
      return `#/bill/${route.id === null ? 'new' : encodeURIComponent(route.id)}`;
    case 'bills':
      return '#/';
    default:
      return `#/${route.name}`;
  }
}

export function navigate(route: Route): void {
  location.hash = href(route);
}

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parseRoute(location.hash));
  useEffect(() => {
    const onChange = () => {
      setRoute(parseRoute(location.hash));
    };
    addEventListener('hashchange', onChange);
    return () => {
      removeEventListener('hashchange', onChange);
    };
  }, []);
  return route;
}
