import path from 'path';

export const getRelativeImportPath = (from: string, to: string): string => {
  let relative = path.relative(from, to);
  if (!relative.startsWith('..')) {
    relative = `./${relative}`;
  }
  return relative.replace('.ts', '');
};
