import { cyrillicToLatin } from '../core/serbia/translit';

/** "Porez na imovinu" -> "porez-na-imovinu", safe in a file name. */
export function fileSlug(s: string): string {
  return cyrillicToLatin(s)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'dj')
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

export function download(data: BlobPart, type: string, name: string): void {
  const url = URL.createObjectURL(new Blob([data], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 0);
}
