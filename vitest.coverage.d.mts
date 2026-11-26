export declare function coverage(
  reportsDirectory: string,
  files?: { include?: string[]; exclude?: string[] },
): {
  enabled: true;
  provider: 'v8';
  reportsDirectory: string;
  include: string[];
  exclude: string[];
  reporter: string[];
  thresholds: { statements: number; lines: number; functions: number; branches: number };
};
