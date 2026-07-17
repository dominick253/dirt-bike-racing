/**
 * Career Manager — localStorage persistence for race stats
 */

export interface CareerData {
  version: number;
  totalWins: number;
  totalRaces: number;
  bestLap: number;
  national: ModeStats;
  stunt: ModeStats;
  enduro: ModeStats;
  supercross: ModeStats;
  selectedBike: number;
}

export interface ModeStats {
  wins: number;
  bestLap: number;
  totalRaces: number;
}

const STORAGE_KEY = 'mx3d_career';
const CURRENT_VERSION = 1;

export class CareerManager {
  private data: CareerData;

  constructor() {
    this.data = this.load();
  }

  private load(): CareerData {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CareerData;
        if (parsed.version === CURRENT_VERSION) {
          return parsed;
        }
        // Migration: rebuild missing fields
        return this.defaultData();
      }
    } catch {
      // Corrupted data — start fresh
    }
    return this.defaultData();
  }

  private defaultData(): CareerData {
    return {
      version: CURRENT_VERSION,
      totalWins: 0,
      totalRaces: 0,
      bestLap: 0,
      national: this.defaultModeStats(),
      stunt: this.defaultModeStats(),
      enduro: this.defaultModeStats(),
      supercross: this.defaultModeStats(),
      selectedBike: 0,
    };
  }

  private defaultModeStats(): ModeStats {
    return { wins: 0, bestLap: 0, totalRaces: 0 };
  }

  saveRace(mode: string, position: number, time: number): void {
    this.data.totalRaces++;
    const modeKey = mode.toLowerCase() as keyof Omit<CareerData, 'version' | 'totalWins' | 'totalRaces' | 'bestLap' | 'selectedBike'>;
    const modeStats = this.data[modeKey] as ModeStats | undefined;

    if (modeStats) {
      modeStats.totalRaces++;
      if (position === 1) {
        modeStats.wins++;
        this.data.totalWins++;
      }
      if (time > 0 && (modeStats.bestLap === 0 || time < modeStats.bestLap)) {
        modeStats.bestLap = time;
      }
    }

    if (time > 0 && (this.data.bestLap === 0 || time < this.data.bestLap)) {
      this.data.bestLap = time;
    }

    this.persist();
  }

  selectBike(index: number): void {
    this.data.selectedBike = index;
    this.persist();
  }

  getSelectedBike(): number {
    return this.data.selectedBike;
  }

  getData(): CareerData {
    return { ...this.data };
  }

  reset(): void {
    this.data = this.defaultData();
    this.persist();
  }

  private persist(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch {
      // Storage full — ignore
    }
  }
}
