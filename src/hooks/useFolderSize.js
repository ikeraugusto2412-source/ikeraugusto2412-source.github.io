import { useSyncExternalStore } from 'react';

/* <Folder> renders at a fixed pixel width, so pick the largest size that fits the viewport */
const FOLDER_QUERIES = [
  ['sm', '(max-width: 380px)'],
  ['md', '(max-width: 520px)'],
];

function subscribeToResize(callback) {
  window.addEventListener('resize', callback);
  return () => window.removeEventListener('resize', callback);
}

function getFolderSize() {
  const match = FOLDER_QUERIES.find(([, query]) => window.matchMedia(query).matches);
  return match ? match[0] : 'lg';
}

export default function useFolderSize() {
  return useSyncExternalStore(subscribeToResize, getFolderSize, () => 'lg');
}
