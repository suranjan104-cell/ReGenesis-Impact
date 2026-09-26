/* The registers the site already publishes, fetched from the same origin.
   Relative paths so the workspace works at /app/ on the custom domain and on
   the GitHub Pages mirror, which serves the repository under a sub-path. */

export type Registers = {
  scope: any; transition: any; au: any; sg: any;
  factors: { factors: Factor[] };
};

export type Factor = {
  id: string; name: string; category: string; value: number | null; unit: string;
  region: string; confidence: 'high' | 'medium' | 'low'; vintage: number | null;
  source: { publisher: string; document?: string; url?: string };
};

const PATHS = {
  scope: '../knowledge/esrs/scope.json',
  transition: '../knowledge/esrs/transition.json',
  au: '../knowledge/markets/australia.json',
  sg: '../knowledge/markets/singapore.json',
  factors: '../knowledge/factors.json',
} as const;

export async function loadRegisters(): Promise<Registers> {
  const entries = await Promise.all(
    (Object.keys(PATHS) as (keyof typeof PATHS)[]).map(async k => {
      const res = await fetch(PATHS[k]);
      if (!res.ok) throw new Error(`${PATHS[k]} returned ${res.status}`);
      return [k, await res.json()] as const;
    }),
  );
  return Object.fromEntries(entries) as Registers;
}
