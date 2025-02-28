// types.ts
export interface Trigram {
    name: string;
    symbol: string;
    lines: number[];
  }
  
  export interface Hexagram {
    name: string;
    judgment: string;
    xiang?: string;
    lines: string[];
  }
  
  export interface HourZodiac {
    start: [number, number];
    end: [number, number];
    zodiac: string;
    num: number;
  }
  