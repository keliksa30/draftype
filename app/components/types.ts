export type Mode = "typeTapToe" | "fingertype" | "brickType" | "specimen";
export type DrawTool = "move" | "hand" | "brush" | "pen" | "eraser" | "fill" | "line" | "rect" | "ellipse";
export type MagicAction =
  | "autotrace"
  | "removeBg"
  | "autoKern"
  | "autoNeat"
  | "exportOtf"
  | "exportTtf"
  | "importFont";

export type GlyphArt = {
  svg: string;
  rotation: number;
  scale: number;
  x: number;
  y: number;
  kerning: number;
};

export type DrawPoint = {
  x: number;
  y: number;
  move: boolean;
  curve?: boolean;
  cx?: number;
  cy?: number;
};

export type BrickGrid = {
  size: number;
  cells: boolean[][];
};

export type ConfirmModalState = {
  isOpen: boolean;
  message: string;
  onConfirm: () => void;
};

export interface ClearedGlyphBackup {
  mode: Mode;
  glyph: string;
  svg: string;
  drawPoints: DrawPoint[];
  brickGrid: BrickGrid | null;
  workingSvg: string;
  referenceImage: string;
}


