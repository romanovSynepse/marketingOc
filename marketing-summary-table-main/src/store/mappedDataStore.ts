import { create } from "zustand";
import { persist } from "zustand/middleware";

// ─── Store: хранит результат маппинга импорта → поля РНП ──────────────────────

type MappedValues = Record<string, number | string>;

interface MappedDataStore {
  values: MappedValues;
  appliedAt: string | null;
  sourceName: string | null;
  applyMapping: (values: MappedValues, sourceName?: string) => void;
  clearMapping: () => void;
}

export const useMappedData = create<MappedDataStore>()(
  persist(
    (set) => ({
      values: {},
      appliedAt: null,
      sourceName: null,
      applyMapping: (values, sourceName) =>
        set({ values, appliedAt: new Date().toISOString(), sourceName: sourceName ?? null }),
      clearMapping: () => set({ values: {}, appliedAt: null, sourceName: null }),
    }),
    { name: "rnp-mapped-data" }
  )
);
