import { useEffect, useState } from 'preact/hooks';

export interface PeriodRef {
  billId: string;
  periodKey: string;
}

export type Route =
  | { name: 'timeline' }
  | { name: 'list' }
  | { name: 'bills' }
  | { name: 'bill'; id: string | null }
  | { name: 'sections' }
  | { name: 'profiles' }
  | { name: 'data' }
  | { name: 'print'; items: PeriodRef[] };

export function parseRoute(hash: string): Route {
  const parts = hash.replace(/^#\/?/, '').split('/');
  switch (parts[0]) {
    case 'list':
      return { name: 'list' };
    case 'bills':
      return { name: 'bills' };
    case 'sections':
      return { name: 'sections' };
    case 'profiles':
      return { name: 'profiles' };
    case 'data':
      return { name: 'data' };
    case 'print':
      return {
        name: 'print',
        items: (parts[1] ?? '')
          .split(',')
          .map((item) => item.split(':').map(decodeURIComponent))
          .flatMap(([billId, periodKey]) =>
            billId && periodKey ? [{ billId, periodKey }] : [],
          ),
      };
    case 'bill': {
      const id = parts[1];
      return {
        name: 'bill',
        id: id && id !== 'new' ? decodeURIComponent(id) : null,
      };
    }
    default:
      return { name: 'timeline' };
  }
}

export function href(route: Route): string {
  switch (route.name) {
    case 'bill':
      return `#/bill/${route.id === null ? 'new' : encodeURIComponent(route.id)}`;
    case 'print':
      return `#/print/${route.items
        .map(
          (i) =>
            `${encodeURIComponent(i.billId)}:${encodeURIComponent(i.periodKey)}`,
        )
        .join(',')}`;
    case 'timeline':
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
