export type Persistence = 'persisted' | 'best-effort' | 'unsupported';

type PersistApi = Partial<Pick<StorageManager, 'persist' | 'persisted'>>;

export async function requestPersistence(
  storage: PersistApi | undefined = (navigator as Partial<Navigator>).storage,
): Promise<Persistence> {
  if (!storage?.persist || !storage.persisted) return 'unsupported';
  try {
    if (await storage.persisted()) return 'persisted';
    return (await storage.persist()) ? 'persisted' : 'best-effort';
  } catch {
    return 'best-effort';
  }
}
