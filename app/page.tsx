"use client";

/* eslint-disable react-hooks/set-state-in-effect */


import { ChangeEvent, PointerEvent, useMemo, useRef, useState, useEffect } from "react";
import paper from "paper/dist/paper-core";

// Components
import ProjectActions from "./components/ProjectActions";
import TopBar from "./components/TopBar";
import ModeSelector from "./components/ModeSelector";
import GuideCard from "./components/GuideCard";
import TypeTapToePanel from "./components/TypeTapToePanel";
import FingerTypePanel from "./components/FingerTypePanel";
import BrickTypePanel from "./components/BrickTypePanel";
import DrawingCanvas from "./components/DrawingCanvas";
import CanvasControls from "./components/CanvasControls";
import GlyphStrip from "./components/GlyphStrip";
import LivePreview from "./components/LivePreview";
import GlyphEditPanel from "./components/GlyphEditPanel";
import ExportPanel from "./components/ExportPanel";
import ConfirmModal from "./components/ConfirmModal";
import CustomGlyphModal from "./components/CustomGlyphModal";
import DarkModeToggle from "./components/DarkModeToggle";
import HistoryPanel from "./components/HistoryPanel";
import KerningPairsPanel from "./components/KerningPairsPanel";
import SpecimenPlayground from "./components/SpecimenPlayground";

// Shared types & utilities
import { Mode, DrawTool, MagicAction, GlyphArt, DrawPoint, BrickGrid, ConfirmModalState, ClearedGlyphBackup } from "./components/types";
import { PaperCanvasRef } from "./components/PaperCanvas";
import {
  glyphs,
  emptyGlyph,
  makePixelSvg,
  makeImageSvg,
  samplePixelGlyph,
  cleanSvg,
  autoFitSvgContent,
  normalizeSvgToCanvas,
  smoothPoints,
  pathFromPoints,
  pointsFromSvg,
  applyAutoKerning,
  applyAutoNeatMap,
  neatSingleGlyph,
  getGlyphBounds,
  computeGlyphAdvance,
  loadSvgToBrickGrid,
  readFileAsDataUrl,
  getCalligraphyPath,
  getPointedPath,
} from "./components/constants";
import { saveDraftToDB, loadDraftFromDB, clearDraftFromDB } from "./utils/db";
import { translations, Lang, I18nProvider, useI18n } from "./utils/i18n";

let potraceInitPromise: Promise<any> | null = null;

function MainApp() {
  const [mode, setMode] = useState<Mode>("typeTapToe");
  const [confirmModal, setConfirmModal] = useState<ConfirmModalState>({
    isOpen: false,
    message: "",
    onConfirm: () => {},
  });
  const [isCustomGlyphModalOpen, setIsCustomGlyphModalOpen] = useState(false);
  const [lastPlacedStrokes, setLastPlacedStrokes] = useState<DrawPoint[]>([]);
  const [previousGlyphSvg, setPreviousGlyphSvg] = useState<string>("");
  const [activeGlyph, setActiveGlyph] = useState("A");
  const [glyphMap, setGlyphMap] = useState<Record<string, GlyphArt>>({
    A: {
      ...emptyGlyph(),
      svg: samplePixelGlyph,
      scale: 90,
    },
  });
  const [workingSvg, setWorkingSvg] = useState(samplePixelGlyph);
  const [fileName, setFileName] = useState("starter pixel A");
  const [traceStatus, setTraceStatus] = useState("Ready");
  const [uploadedImage, setUploadedImage] = useState("");
  const [traceThreshold, setTraceThreshold] = useState(128);
  const [traceStyle, setTraceStyle] = useState<"pixel" | "smooth">("smooth");
  const [traceDetail, setTraceDetail] = useState(4);
  const [traceAlpha, setTraceAlpha] = useState(48);
  const [bgTolerance, setBgTolerance] = useState(34);
  const [typeZoom, setTypeZoom] = useState(100);
  const [workHistory, setWorkHistory] = useState<
    { svg: string; image: string; status: string }[]
  >([]);
  const [brushSize, setBrushSize] = useState(10);
  const [drawTool, setDrawTool] = useState<DrawTool>("brush");
  const [fingerZoom, setFingerZoom] = useState(100);
  const [smoothness, setSmoothness] = useState(22);
  const [drawPoints, setDrawPointsState] = useState<DrawPoint[]>([]);
  const [isDrawingModified, setIsDrawingModified] = useState(false);
  const setDrawPoints = (val: DrawPoint[] | ((prev: DrawPoint[]) => DrawPoint[])) => {
    setDrawPointsState(val);
    if (mode === "fingertype") {
      setIsDrawingModified(true);
    }
  };
  const activeStrokePointsRef = useRef<DrawPoint[]>([]);
  const [dynamicGlyphs, setDynamicGlyphs] = useState<string[]>(glyphs);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingFilled, setDrawingFilled] = useState(false);
  const [nextPenMove, setNextPenMove] = useState(true);
  const [penPreviewPoint, setPenPreviewPoint] = useState<{ x: number; y: number } | null>(null);
  const [fingerImage, setFingerImage] = useState("");
  const [referenceImage, setReferenceImage] = useState("");
  const [referenceOpacity, setReferenceOpacity] = useState(38);
  const [fontName, setFontName] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("draftype_font_name") ?? "";
    }
    return "";
  });
  const [previewText, setPreviewText] = useState("DrafType");
  const [exportStatus, setExportStatus] = useState("Ready to export");
  const [exportSpacingMode, setExportSpacingMode] = useState<"proportional" | "monospace">("proportional");
  const [glyphScroll, setGlyphScroll] = useState(0);
  const [magicLoading, setMagicLoading] = useState<MagicAction | null>(null);
  const [revertGlyphMap, setRevertGlyphMap] = useState<Record<string, GlyphArt> | null>(null);

  // Guidelines & Draw Canvas History
  const [showGuides, setShowGuides] = useState(true);
  const [drawHistory, setDrawHistory] = useState<{ points: DrawPoint[]; filled: boolean }[]>([]);
  const [drawHistoryIndex, setDrawHistoryIndex] = useState(-1);

  // BrickType (Pixel Grid) State
  const [brickGrids, setBrickGrids] = useState<Record<string, BrickGrid>>({});
  const [brickTool, setBrickTool] = useState<"pencil" | "eraser">("pencil");
  const [isDrawingBrick, setIsDrawingBrick] = useState(false);
  const [lastToggledCell, setLastToggledCell] = useState<{ r: number; c: number } | null>(null);
  const [previousBrickGrid, setPreviousBrickGrid] = useState<BrickGrid | null>(null);
  const [brickHistory, setBrickHistory] = useState<Record<string, BrickGrid[]>>({});
  const [brickHistoryIndex, setBrickHistoryIndex] = useState<Record<string, number>>({});
  const [clearedGlyphBackup, setClearedGlyphBackup] = useState<ClearedGlyphBackup | null>(null);
  const [shapeStart, setShapeStart] = useState<{ x: number; y: number } | null>(null);
  const [shapePreview, setShapePreview] = useState<{ x: number; y: number } | null>(null);

  // Font Metadata
  const [fontDesigner, setFontDesigner] = useState(() => {
    if (typeof window !== "undefined") return localStorage.getItem("draftype_font_designer") ?? "";
    return "";
  });
  const [fontStyle, setFontStyle] = useState("Regular");

  // Template Guide and Onboarding states
  const [templateStyle, setTemplateStyle] = useState<"none" | "sans" | "serif" | "cursive">("none");
  const [onboardingStep, setOnboardingStep] = useState<null | number>(null);
  const [fontVersion, setFontVersion] = useState("1.0.0");
  const [fontLicense, setFontLicense] = useState("SIL Open Font License");

  // New States for Antigravity Suggestion Upgrades
  const [showOnionSkin, setShowOnionSkin] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<"design" | "kerning" | "history">("design");
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [gridSnapSize, setGridSnapSize] = useState(2.5);
  const [penType, setPenType] = useState<"round" | "calligraphy" | "pointed">("round");
  const [penAngle, setPenAngle] = useState(45);
  const [kerningPairs, setKerningPairs] = useState<Record<string, number>>({});
  
  // Global History State
  const [globalHistory, setGlobalHistory] = useState<{
    description: string;
    glyphMap: Record<string, GlyphArt>;
    brickGrids: Record<string, BrickGrid>;
    kerningPairs: Record<string, number>;
    mode: Mode;
  }[]>([]);
  const [globalHistoryIndex, setGlobalHistoryIndex] = useState(-1);
  const [isInitialLoadDone, setIsInitialLoadDone] = useState(false);
  const [isLeftDrawerOpen, setIsLeftDrawerOpen] = useState(false);
  const [isRightDrawerOpen, setIsRightDrawerOpen] = useState(false);
  const { lang, setLang, t } = useI18n();

  const pushGlobalHistory = (
    description: string,
    nextGlyphMap = glyphMap,
    nextBrickGrids = brickGrids,
    nextKerningPairs = kerningPairs,
    nextMode = mode
  ) => {
    setGlobalHistory((prev) => {
      const sliced = prev.slice(0, globalHistoryIndex + 1);
      return [
        ...sliced,
        {
          description,
          glyphMap: JSON.parse(JSON.stringify(nextGlyphMap)),
          brickGrids: JSON.parse(JSON.stringify(nextBrickGrids)),
          kerningPairs: JSON.parse(JSON.stringify(nextKerningPairs)),
          mode: nextMode,
        },
      ].slice(-30);
    });
    setGlobalHistoryIndex((prev) => Math.min(29, prev + 1));
  };

  // IndexedDB Auto-Save & Loading Effects
  useEffect(() => {
    const loadDraft = async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const obj = (await loadDraftFromDB()) as any;
        if (obj) {
          setFontName(obj.fontName ?? "");
          setFontDesigner(obj.fontDesigner ?? "");
          setFontStyle(obj.fontStyle ?? "Regular");
          setFontVersion(obj.fontVersion ?? "1.0.0");
          setFontLicense(obj.fontLicense ?? "SIL Open Font License");
          
          const loadedGlyphMap = obj.glyphMap ?? {};
          const loadedBrickGrids = obj.brickGrids ?? {};
          const loadedKerningPairs = obj.kerningPairs ?? {};

          const uniqueGlyphs = Array.from(
            new Set([
              ...glyphs,
              ...Object.keys(loadedGlyphMap).filter((k) => k.length === 1),
            ])
          );
          setDynamicGlyphs(uniqueGlyphs);

          setGlyphMap(loadedGlyphMap);
          setActiveGlyph(obj.activeGlyph ?? "A");
          setBrickGrids(loadedBrickGrids);
          setKerningPairs(loadedKerningPairs);
          setSnapToGrid(obj.snapToGrid ?? false);
          setGridSnapSize(obj.gridSnapSize ?? 2.5);
          setPenType(obj.penType ?? "round");
          setPenAngle(obj.penAngle ?? 45);

          pushGlobalHistory("Draft dipulihkan otomatis", loadedGlyphMap, loadedBrickGrids, loadedKerningPairs);
          setExportStatus(t("draft_restored"));
        }
      } catch (e) {
        console.error("Gagal memuat draf dari IndexedDB:", e);
      } finally {
        setIsInitialLoadDone(true);
      }
    };
    loadDraft();
  }, []);

  useEffect(() => {
    if (!isInitialLoadDone) return;

    const timer = setTimeout(() => {
      const data = {
        fontName,
        fontDesigner,
        fontStyle,
        fontVersion,
        fontLicense,
        glyphMap,
        activeGlyph,
        brickGrids,
        kerningPairs,
        snapToGrid,
        gridSnapSize,
        penType,
        penAngle,
      };
      saveDraftToDB(data)
        .then(() => setExportStatus("Draft autosaved"))
        .catch(console.error);
    }, 1500);

    return () => clearTimeout(timer);
  }, [isInitialLoadDone, fontName, fontDesigner, fontStyle, fontVersion, fontLicense, glyphMap, activeGlyph, brickGrids, kerningPairs, snapToGrid, gridSnapSize, penType, penAngle]);

  const selectedGlyph = glyphMap[activeGlyph] ?? emptyGlyph();

  const jumpToHistoryIndex = (index: number) => {
    if (index >= 0 && index < globalHistory.length) {
      const entry = globalHistory[index];
      setGlyphMap(entry.glyphMap);
      setBrickGrids(entry.brickGrids);
      setKerningPairs(entry.kerningPairs);
      setMode(entry.mode);
      setGlobalHistoryIndex(index);
    }
  };

  useEffect(() => {
    if (globalHistory.length === 0 && Object.keys(glyphMap).length > 0) {
      setGlobalHistory([
        {
          description: "Proyek Dimulai",
          glyphMap: JSON.parse(JSON.stringify(glyphMap)),
          brickGrids: JSON.parse(JSON.stringify(brickGrids)),
          kerningPairs: JSON.parse(JSON.stringify(kerningPairs)),
          mode,
        }
      ]);
      setGlobalHistoryIndex(0);
    }
  }, [glyphMap, brickGrids, kerningPairs, mode]);


  const drawingRef = useRef<SVGSVGElement | null>(null);
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const paperCanvasRef = useRef<PaperCanvasRef | null>(null);
  const glyphStripRef = useRef<HTMLDivElement | null>(null);
  const panStartRef = useRef<{ x: number; y: number; left: number; top: number } | null>(null);
  const moveStartRef = useRef<{ x: number; y: number } | null>(null);
  const lastErasePointRef = useRef<{ x: number; y: number } | null>(null);
  const rAFRef = useRef<number | null>(null);

  useEffect(() => {
    if (mode === "brickType" && selectedGlyph?.svg) {
      const currentGrid = brickGrids[activeGlyph];
      const isEmpty = !currentGrid || currentGrid.cells.every((row) => row.every((c) => !c));
      if (isEmpty) {
        const gridSize = currentGrid?.size || 16;
        loadSvgToBrickGrid(selectedGlyph.svg, gridSize).then((cells) => {
          setBrickGrids((prev) => ({
            ...prev,
            [activeGlyph]: { size: gridSize, cells },
          }));
        });
      }
    }
  }, [mode, activeGlyph, selectedGlyph?.svg]); // eslint-disable-line react-hooks/exhaustive-deps

  // Initial Onboarding check
  useEffect(() => {
    if (typeof window !== "undefined") {
      const onboarded = localStorage.getItem("draftype_onboarded");
      if (!onboarded) {
        setOnboardingStep(0);
      }
    }
  }, []);



  const smoothedDrawPoints = useMemo(
    () => smoothPoints(drawPoints, smoothness),
    [drawPoints, smoothness],
  );
  const drawingPath = useMemo(
    () => pathFromPoints(smoothedDrawPoints),
    [smoothedDrawPoints],
  );
  const lastPenPoint = useMemo(() => {
    for (let index = smoothedDrawPoints.length - 1; index >= 0; index -= 1) {
      const point = smoothedDrawPoints[index];
      if (!point.move) return point;
      if (index === smoothedDrawPoints.length - 1) return point;
    }
    return smoothedDrawPoints[smoothedDrawPoints.length - 1] ?? null;
  }, [smoothedDrawPoints]);
  const filledCount = useMemo(
    () => Object.values(glyphMap).filter((glyph) => glyph.svg).length,
    [glyphMap],
  );
  const hasTypeDraft =
    mode === "typeTapToe" &&
    !traceStatus.startsWith("Placed") &&
    (Boolean(uploadedImage) ||
      traceStatus.includes("Autotraced") ||
      traceStatus.includes("Background removed") ||
      traceStatus.includes("ready to edit") ||
      traceStatus.includes("ready to place") ||
      traceStatus.includes("SVG siap") ||
      traceStatus.includes("Gambar siap"));

  // ─── Glyph Strip Scroll ──────────────────────────────────────────────────────

  const updateGlyphScroll = () => {
    const strip = glyphStripRef.current;
    if (!strip) return;
    const max = strip.scrollWidth - strip.clientWidth;
    setGlyphScroll(max > 0 ? Math.round((strip.scrollLeft / max) * 100) : 0);
  };

  const scrollGlyphStrip = (direction: -1 | 1) => {
    const strip = glyphStripRef.current;
    if (!strip) return;
    strip.scrollBy({ left: direction * strip.clientWidth * 0.76, behavior: "smooth" });
    window.setTimeout(updateGlyphScroll, 220);
  };

  const setGlyphStripScroll = (value: number) => {
    setGlyphScroll(value);
    const strip = glyphStripRef.current;
    if (!strip) return;
    const max = strip.scrollWidth - strip.clientWidth;
    strip.scrollLeft = max * (value / 100);
  };

  // ─── Magic Action Runner ─────────────────────────────────────────────────────

  const runMagic = async (action: MagicAction, task: () => void | Promise<void>) => {
    setMagicLoading(action);
    const minimumBeat = new Promise((resolve) => window.setTimeout(resolve, 720));
    try {
      await Promise.all([Promise.resolve(task()), minimumBeat]);
    } finally {
      setMagicLoading((current) => (current === action ? null : current));
    }
  };

  // ─── Glyph Update ────────────────────────────────────────────────────────────

  const updateGlyph = (patch: Partial<GlyphArt>) => {
    setGlyphMap((current) => ({
      ...current,
      [activeGlyph]: {
        ...(current[activeGlyph] ?? emptyGlyph()),
        ...patch,
      },
    }));
  };

  // ─── Work History (TypeTapToe) ───────────────────────────────────────────────

  const pushWorkHistory = () => {
    setWorkHistory((current) => [
      ...current.slice(-5),
      { svg: workingSvg, image: uploadedImage, status: traceStatus },
    ]);
  };

  const undoWorkingChange = () => {
    setWorkHistory((current) => {
      const previous = current[current.length - 1];
      if (!previous) {
        setTraceStatus("Nothing to undo");
        return current;
      }
      setWorkingSvg(previous.svg);
      setUploadedImage(previous.image);
      setTraceStatus(`Undo: ${previous.status}`);
      return current.slice(0, -1);
    });
  };

  const clearTypeUpload = () => {
    pushWorkHistory();
    setReferenceImage("");
    setFingerImage("");
    setUploadedImage("");
    setWorkingSvg(samplePixelGlyph);
    setFileName("no image selected");
    setTraceStatus("Image cleared");
  };

  // ─── Project Save / Load ─────────────────────────────────────────────────────

  const saveProject = () => {
    const data = {
      fontName,
      fontDesigner,
      fontStyle,
      fontVersion,
      fontLicense,
      glyphMap,
      activeGlyph,
      brickGrids,
      kerningPairs,
      snapToGrid,
      gridSnapSize,
      penType,
      penAngle,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(fontName.trim() || "draftype-project").toLowerCase().replace(/[^a-z0-9]+/g, "-")}.draftype`;
    a.click();
    URL.revokeObjectURL(url);
    setExportStatus("Project saved");
  };

  const loadProject = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const txt = await file.text();
    try {
      const obj = JSON.parse(txt);
      setFontName(obj.fontName ?? "");
      setFontDesigner(obj.fontDesigner ?? "");
      setFontStyle(obj.fontStyle ?? "Regular");
      setFontVersion(obj.fontVersion ?? "1.0.0");
      setFontLicense(obj.fontLicense ?? "SIL Open Font License");
      
      const loadedGlyphMap = obj.glyphMap ?? {};
      const loadedBrickGrids = obj.brickGrids ?? {};
      const loadedKerningPairs = obj.kerningPairs ?? {};

      const uniqueGlyphs = Array.from(
        new Set([
          ...glyphs,
          ...Object.keys(loadedGlyphMap).filter((k) => k.length === 1),
        ])
      );
      setDynamicGlyphs(uniqueGlyphs);

      setGlyphMap(loadedGlyphMap);
      setActiveGlyph(obj.activeGlyph ?? "A");
      setBrickGrids(loadedBrickGrids);
      setKerningPairs(loadedKerningPairs);
      setSnapToGrid(obj.snapToGrid ?? false);
      setGridSnapSize(obj.gridSnapSize ?? 2.5);
      setPenType(obj.penType ?? "round");
      setPenAngle(obj.penAngle ?? 45);

      pushGlobalHistory("Buka Proyek Baru", loadedGlyphMap, loadedBrickGrids, loadedKerningPairs);
      setExportStatus("Project loaded");
    } catch {
      setExportStatus("Invalid .draftype file");
    }
  };

  const generateSvgFromDrawingPoints = (): string => {
    // If not modified, return original SVG to preserve 100% detail
    if (!isDrawingModified && selectedGlyph.svg) {
      return selectedGlyph.svg;
    }

    let innerContent = "";
    let vbX = 0;
    let vbY = 0;
    let viewBoxWidth = 100;
    let viewBoxHeight = 100;

    // 1. Keep original high-resolution SVG contents untouched
    if (selectedGlyph.svg) {
      const contentMatch = selectedGlyph.svg.match(/<svg[^>]*>([\s\S]*?)<\/svg>/i);
      if (contentMatch) {
        innerContent = contentMatch[1];
      }
      // Handle floating point viewBoxes (e.g. from potrace: "0 0 512.000000 512.000000")
      const viewBoxMatch = selectedGlyph.svg.match(/viewBox=["']\s*(-?\d*\.?\d+)\s+(-?\d*\.?\d+)\s+(\d*\.?\d+)\s+(\d*\.?\d+)\s*["']/i);
      if (viewBoxMatch) {
        vbX = parseFloat(viewBoxMatch[1]);
        vbY = parseFloat(viewBoxMatch[2]);
        viewBoxWidth = parseFloat(viewBoxMatch[3]);
        viewBoxHeight = parseFloat(viewBoxMatch[4]);
      }
    } else if (fingerImage) {
      innerContent = `<image href="${fingerImage}" x="0" y="0" width="100" height="100" preserveAspectRatio="xMidYMid meet"/>`;
    }

    // 2. Append drawing/eraser strokes on top, scaled to the original SVG viewBox
    if (smoothedDrawPoints.length > 0) {
      const scaleX = viewBoxWidth / 100;
      const scaleY = viewBoxHeight / 100;
      
      // Group points into consecutive segments by tool type (brush/eraser)
      const segments: { points: DrawPoint[]; isEraser: boolean }[] = [];
      let currentSeg: DrawPoint[] = [];
      let currentIsEraser = false;

      for (let i = 0; i < smoothedDrawPoints.length; i++) {
        const p = smoothedDrawPoints[i];
        const isEraser = !!p.isEraser;

        if (p.move || isEraser !== currentIsEraser) {
          if (currentSeg.length > 0) {
            segments.push({ points: currentSeg, isEraser: currentIsEraser });
          }
          currentSeg = [p];
          currentIsEraser = isEraser;
        } else {
          currentSeg.push(p);
        }
      }
      if (currentSeg.length > 0) {
        segments.push({ points: currentSeg, isEraser: currentIsEraser });
      }

      // Convert each segment to a path element and scale it
      let appendedPathsSvg = "";
      for (const segment of segments) {
        // Scale coordinates directly instead of wrapping in a group transform
        const scaledPoints = segment.points.map((p) => ({
          ...p,
          x: p.x * scaleX + vbX,
          y: p.y * scaleY + vbY,
          cx: p.cx !== undefined ? p.cx * scaleX + vbX : undefined,
          cy: p.cy !== undefined ? p.cy * scaleY + vbY : undefined,
        }));

        // Average scale factor for brush size approximation
        const avgScale = (scaleX + scaleY) / 2;
        const segmentBrushSize = brushSize * avgScale;
        let pathD = "";
        let strokeColor = "currentColor";
        let fillColor = "none";
        let strokeWidth = segmentBrushSize.toString();

        if (segment.isEraser) {
          pathD = pathFromPoints(scaledPoints);
          strokeColor = "#ffffff"; // White color for subtraction
          fillColor = "none";
          strokeWidth = segmentBrushSize.toString();
        } else {
          if (penType === "calligraphy") {
            pathD = getCalligraphyPath(scaledPoints, segmentBrushSize, penAngle);
            strokeColor = "currentColor";
            fillColor = "currentColor";
            strokeWidth = "0.2";
          } else if (penType === "pointed") {
            pathD = getPointedPath(scaledPoints, segmentBrushSize);
            strokeColor = "currentColor";
            fillColor = "currentColor";
            strokeWidth = "0.2";
          } else {
            pathD = pathFromPoints(scaledPoints);
            strokeColor = "currentColor";
            fillColor = drawingFilled ? "currentColor" : "none";
            strokeWidth = segmentBrushSize.toString();
          }
        }

        if (pathD) {
          appendedPathsSvg += `<path d="${pathD}" stroke="${strokeColor}" fill="${fillColor}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>`;
        }
      }

      if (appendedPathsSvg) {
        innerContent += appendedPathsSvg;
      }
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vbX} ${vbY} ${viewBoxWidth} ${viewBoxHeight}" fill="none">${innerContent}</svg>`;
  };

  const compileDrawingToSvg = (): string => {
    if (mode === "fingertype" && paperCanvasRef.current) {
      const paperSvg = paperCanvasRef.current.exportSVG();
      if (paperSvg) return paperSvg;
    }
    return generateSvgFromDrawingPoints();
  };

  const compileBrickToSvg = (): string => {
    const { size, cells } = getActiveBrickGrid();
    return generateBrickSvg(cells, size);
  };

  const switchMode = async (nextMode: Mode) => {
    pushGlobalHistory(`Mode ${mode === "fingertype" ? "FingerType" : mode === "brickType" ? "BrickType" : mode} ➔ ${nextMode === "fingertype" ? "FingerType" : nextMode === "brickType" ? "BrickType" : nextMode}`);
    let currentSvg = workingSvg || selectedGlyph?.svg;

    if (mode === "fingertype" && isDrawingModified) {
      currentSvg = compileDrawingToSvg();
      setWorkingSvg(currentSvg);
      setDrawPoints([]);
      setIsDrawingModified(false);
    }

    if (mode !== "brickType" && currentSvg) {
      setGlyphMap((current) =>
        applyAutoKerning({
          ...current,
          [activeGlyph]: {
            ...(current[activeGlyph] ?? emptyGlyph()),
            svg: currentSvg,
          },
        }),
      );
    }

    setMode(nextMode);

    if (nextMode === "fingertype") {
      if (uploadedImage) setFingerImage(uploadedImage);
      const rawSvg = glyphMap[activeGlyph]?.svg || "";
      const vectorSvg = normalizeSvgToCanvas(rawSvg);
      setWorkingSvg(vectorSvg);

      setDrawPoints([]);
      setDrawHistory([]);
      setDrawHistoryIndex(-1);
      setIsDrawingModified(false);
    } else if (nextMode === "brickType") {
      const currentGrid = brickGrids[activeGlyph];
      if (!currentGrid) {
        const size = 16;
        const cells = Array(size).fill(null).map(() => Array(size).fill(false));
        setBrickGrids((prev) => ({
          ...prev,
          [activeGlyph]: { size, cells },
        }));
      }
      const activeGrid = brickGrids[activeGlyph] || currentGrid || { size: 16, cells: Array(16).fill(null).map(() => Array(16).fill(false)) };
      setWorkingSvg(generateBrickSvg(activeGrid.cells, activeGrid.size));
    }
  };

  // ─── Assign Working SVG (TypeTapToe) ─────────────────────────────────────────

  const applyNewSvgToMap = (current: Record<string, GlyphArt>, svg: string) => {
    const normalized = mode === "brickType" ? svg : normalizeSvgToCanvas(svg);
    const updatedGlyph = {
      ...(current[activeGlyph] ?? emptyGlyph()),
      svg: normalized,
      scale: 100,
      x: 0,
      y: 0,
      rotation: 0,
    };

    return applyAutoKerning({ ...current, [activeGlyph]: updatedGlyph });
  };

  const assignWorkingSvg = () => {
    setRevertGlyphMap(glyphMap);
    setGlyphMap((current) => applyNewSvgToMap(current, workingSvg));
    setTraceStatus(`Placed in ${activeGlyph}`);
  };

  const updateWorkingSvg = (svg: string) => {
    setWorkingSvg(svg);
    setGlyphMap((current) =>
      applyAutoKerning({
        ...current,
        [activeGlyph]: {
          ...(current[activeGlyph] ?? emptyGlyph()),
          svg,
        },
      }),
    );
  };

  // ─── File Upload Handlers ────────────────────────────────────────────────────

  const getPreprocessedBlackAndWhiteCanvas = (srcCanvas: HTMLCanvasElement) => {
    const size = srcCanvas.width;
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = size;
    tempCanvas.height = size;
    const tempCtx = tempCanvas.getContext("2d");
    if (!tempCtx) return srcCanvas;

    tempCtx.drawImage(srcCanvas, 0, 0);
    const imgData = tempCtx.getImageData(0, 0, size, size);
    const data = imgData.data;

    for (let i = 0; i < data.length; i += 4) {
      const alpha = data[i + 3];
      const darkness = 255 - (data[i] + data[i + 1] + data[i + 2]) / 3;
      if (alpha > traceAlpha && darkness > traceThreshold) {
        data[i] = 0;
        data[i + 1] = 0;
        data[i + 2] = 0;
        data[i + 3] = 255;
      } else {
        data[i] = 255;
        data[i + 1] = 255;
        data[i + 2] = 255;
        data[i + 3] = 255;
      }
    }
    tempCtx.putImageData(imgData, 0, 0);
    return tempCanvas;
  };

  const cleanPotraceSvg = (svg: string): string => {
    let cleaned = svg;
    cleaned = cleaned.replace(/<(rect|path)[^>]*\/>/gi, (tag) => {
      const hasWhite = /fill=["']?(?:#ffffff|white|#fff|#FFF|#FFFFFF)["']/i.test(tag) || 
                       /stroke=["']?(?:#ffffff|white|#fff|#FFF|#FFFFFF)["']/i.test(tag) ||
                       /style=["']?[^"']*(?:fill|stroke|background):\s*(?:#ffffff|white|#fff|#FFF|#FFFFFF)/i.test(tag);
      return hasWhite ? "" : tag;
    });
    cleaned = cleaned.replace(/<(rect|path)[^>]*>[\s\S]*?<\/\1>/gi, (tag) => {
      const hasWhite = /fill=["']?(?:#ffffff|white|#fff|#FFF|#FFFFFF)["']/i.test(tag) || 
                       /stroke=["']?(?:#ffffff|white|#fff|#FFF|#FFFFFF)["']/i.test(tag) ||
                       /style=["']?[^"']*(?:fill|stroke|background):\s*(?:#ffffff|white|#fff|#FFF|#FFFFFF)/i.test(tag);
      return hasWhite ? "" : tag;
    });
    return cleaned;
  };

  const traceCanvasWithPotrace = async (canvas: HTMLCanvasElement): Promise<string | null> => {
    try {
      const bwCanvas = getPreprocessedBlackAndWhiteCanvas(canvas);
      const { potrace, init } = await import("esm-potrace-wasm");
      if (!potraceInitPromise) {
        potraceInitPromise = init();
      }
      await potraceInitPromise;

      const svg = await potrace(bwCanvas, {
        turdsize: 2,
        turnpolicy: 4,
        optcurve: true,
        opttolerance: 0.2,
      });
      if (svg) {
        return cleanPotraceSvg(svg as string);
      }
      return svg;
    } catch (e) {
      console.error("Potrace failed, falling back to Marching Squares:", e);
      return null;
    }
  };

  const runSmoothTrace = async (canvas: HTMLCanvasElement): Promise<string> => {
    const potraceResult = await traceCanvasWithPotrace(canvas);
    if (potraceResult) {
      let processed = potraceResult;
      if (processed.includes('fill="black"')) {
        processed = processed.replace('fill="black"', 'fill="currentColor" fill-rule="evenodd"');
      } else if (processed.includes("fill='black'")) {
        processed = processed.replace("fill='black'", 'fill="currentColor" fill-rule="evenodd"');
      } else if (!processed.includes("fill=")) {
        processed = processed.replace('<path ', '<path fill="currentColor" fill-rule="evenodd" ');
      }
      return processed;
    }

    const size = canvas.width;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "";
    const data = ctx.getImageData(0, 0, size, size).data;

    const isDark = (x: number, y: number) => {
      if (x < 0 || x >= size || y < 0 || y >= size) return false;
      const idx = (y * size + x) * 4;
      const alpha = data[idx + 3];
      const darkness = 255 - (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
      return alpha > traceAlpha && darkness > traceThreshold;
    };

    const segments: [number, number, number, number][] = [];

    for (let y = 0; y < size - 1; y += 1) {
      for (let x = 0; x < size - 1; x += 1) {
        const p0 = isDark(x, y) ? 1 : 0;
        const p1 = isDark(x + 1, y) ? 1 : 0;
        const p2 = isDark(x + 1, y + 1) ? 1 : 0;
        const p3 = isDark(x, y + 1) ? 1 : 0;

        const caseIndex = p0 * 8 + p1 * 4 + p2 * 2 + p3 * 1;
        if (caseIndex === 0 || caseIndex === 15) continue;

        const t: [number, number] = [x + 0.5, y];
        const r: [number, number] = [x + 1, y + 0.5];
        const b: [number, number] = [x + 0.5, y + 1];
        const l: [number, number] = [x, y + 0.5];

        if (caseIndex === 1) segments.push([l[0], l[1], b[0], b[1]]);
        else if (caseIndex === 2) segments.push([b[0], b[1], r[0], r[1]]);
        else if (caseIndex === 3) segments.push([l[0], l[1], r[0], r[1]]);
        else if (caseIndex === 4) segments.push([t[0], t[1], r[0], r[1]]);
        else if (caseIndex === 5) {
          segments.push([l[0], l[1], t[0], t[1]]);
          segments.push([b[0], b[1], r[0], r[1]]);
        } else if (caseIndex === 6) segments.push([t[0], t[1], b[0], b[1]]);
        else if (caseIndex === 7) segments.push([l[0], l[1], t[0], t[1]]);
        else if (caseIndex === 8) segments.push([l[0], l[1], t[0], t[1]]);
        else if (caseIndex === 9) segments.push([t[0], t[1], b[0], b[1]]);
        else if (caseIndex === 10) {
          segments.push([l[0], l[1], b[0], b[1]]);
          segments.push([t[0], t[1], r[0], r[1]]);
        } else if (caseIndex === 11) segments.push([t[0], t[1], r[0], r[1]]);
        else if (caseIndex === 12) segments.push([l[0], l[1], r[0], r[1]]);
        else if (caseIndex === 13) segments.push([b[0], b[1], r[0], r[1]]);
        else if (caseIndex === 14) segments.push([l[0], l[1], b[0], b[1]]);
      }
    }

    const paths: string[] = [];
    const visited = new Set<number>();
    const scaleCoord = 100;
    const hashPoint = (px: number, py: number) =>
      `${Math.round(px * scaleCoord)},${Math.round(py * scaleCoord)}`;
    const pointToSegments = new Map<string, number[]>();

    segments.forEach((seg, idx) => {
      const p1 = hashPoint(seg[0], seg[1]);
      const p2 = hashPoint(seg[2], seg[3]);
      if (!pointToSegments.has(p1)) pointToSegments.set(p1, []);
      if (!pointToSegments.has(p2)) pointToSegments.set(p2, []);
      pointToSegments.get(p1)!.push(idx);
      pointToSegments.get(p2)!.push(idx);
    });

    for (let i = 0; i < segments.length; i += 1) {
      if (visited.has(i)) continue;
      const [sx, sy, ex, ey] = segments[i];
      visited.add(i);
      let loop = `M${sx.toFixed(1)} ${sy.toFixed(1)}`;
      let currentHash = hashPoint(ex, ey);
      loop += ` L${ex.toFixed(1)} ${ey.toFixed(1)}`;
      let found = true;
      while (found) {
        found = false;
        const candidates = pointToSegments.get(currentHash) || [];
        for (const nextIdx of candidates) {
          if (!visited.has(nextIdx)) {
            visited.add(nextIdx);
            const nextSeg = segments[nextIdx];
            const h1 = hashPoint(nextSeg[0], nextSeg[1]);
            const h2 = hashPoint(nextSeg[2], nextSeg[3]);
            if (h1 === currentHash) {
              currentHash = h2;
              loop += ` L${nextSeg[2].toFixed(1)} ${nextSeg[3].toFixed(1)}`;
            } else {
              currentHash = h1;
              loop += ` L${nextSeg[0].toFixed(1)} ${nextSeg[1].toFixed(1)}`;
            }
            found = true;
            break;
          }
        }
      }
      loop += " Z";
      paths.push(loop);
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" fill="none"><path d="${paths.join(
      " "
    )}" fill="currentColor" fill-rule="evenodd"/></svg>`;
  };

  const runAutotraceForImage = async (imgUrl: string) => {
    const size = traceStyle === "pixel" ? 96 : 512;
    const result = await drawImageToCanvas(imgUrl, size);
    if (!result) return;
    const svg = await runSmoothTrace(result.canvas);
    const fittedSvg = autoFitSvgContent(svg);

    setWorkingSvg(fittedSvg);
    setGlyphMap((current) =>
      applyAutoKerning({
        ...current,
        [activeGlyph]: {
          ...(current[activeGlyph] ?? emptyGlyph()),
          svg: fittedSvg,
        },
      }),
    );
  };

  const cropImage = (img: HTMLImageElement): string => {
    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return img.src;
    
    ctx.drawImage(img, 0, 0);
    const imgData = ctx.getImageData(0, 0, img.width, img.height);
    const { data, width, height } = imgData;

    let minX = width;
    let maxX = 0;
    let minY = height;
    let maxY = 0;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const a = data[idx + 3];

        const isTransparent = a < 5;
        const isWhite = r > 250 && g > 250 && b > 250;

        if (!isTransparent && !isWhite) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    if (maxX < minX || maxY < minY) {
      return img.src;
    }

    const padding = 10;
    const safeMinX = Math.max(0, minX - padding);
    const safeMaxX = Math.min(width - 1, maxX + padding);
    const safeMinY = Math.max(0, minY - padding);
    const safeMaxY = Math.min(height - 1, maxY + padding);

    const cropWidth = safeMaxX - safeMinX + 1;
    const cropHeight = safeMaxY - safeMinY + 1;

    const cropCanvas = document.createElement("canvas");
    cropCanvas.width = cropWidth;
    cropCanvas.height = cropHeight;
    const cropCtx = cropCanvas.getContext("2d");
    if (!cropCtx) return img.src;

    cropCtx.drawImage(
      canvas,
      safeMinX,
      safeMinY,
      cropWidth,
      cropHeight,
      0,
      0,
      cropWidth,
      cropHeight
    );

    return cropCanvas.toDataURL();
  };

  const processUploadedFile = async (file: File) => {
    setFileName(file.name);

    if (file.type.includes("svg") || file.name.toLowerCase().endsWith(".svg")) {
      const text = await file.text();
      let cleaned = cleanSvg(text);
      cleaned = autoFitSvgContent(cleaned);
      setUploadedImage("");
      setWorkingSvg(cleaned);
      setGlyphMap((current) => applyNewSvgToMap(current, cleaned));
      setTraceStatus("SVG siap diedit");
      return;
    }

    setTraceStatus("Mengimpor dan memproses gambar...");
    const dataUrl = await readFileAsDataUrl(file);
    let finalDataUrl = dataUrl;
    try {
      const image = await loadImage(dataUrl);
      finalDataUrl = cropImage(image);
    } catch (e) {
      console.error("Auto-crop failed, using original image:", e);
    }

    setUploadedImage(finalDataUrl);
    const imgSvg = makeImageSvg(finalDataUrl);
    setWorkingSvg(imgSvg);
    setTraceStatus("Gambar di-load. Menunggu konfirmasi...");

    setConfirmModal({
      isOpen: true,
      message: t("confirm_autotrace"),
      onConfirm: async () => {
        setTraceStatus("Mengimpor dan mendeteksi gambar...");
        await runAutotraceForImage(finalDataUrl);
        setTraceStatus("Gambar berhasil di-import dan otomatis di-vectorize!");
      },
    });
  };

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await processUploadedFile(file);
  };

  const handleFileDrop = async (file: File) => {
    await processUploadedFile(file);
  };

  const handleReferenceUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setReferenceImage(await readFileAsDataUrl(file));
  };

  // ─── Image Processing ────────────────────────────────────────────────────────

  const loadImage = (src: string) =>
    new Promise<HTMLImageElement>((resolve) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.src = src;
    });

  const drawImageToCanvas = async (src: string, size: number) => {
    const image = await loadImage(src);
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.clearRect(0, 0, size, size);
    const ratio = Math.min(size / image.width, size / image.height);
    const width = image.width * ratio;
    const height = image.height * ratio;
    const x = (size - width) / 2;
    const y = (size - height) / 2;
    ctx.drawImage(image, x, y, width, height);
    return { canvas, ctx };
  };

  const drawImageToNaturalCanvas = async (src: string, maxSize: number) => {
    const image = await loadImage(src);
    const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    return { canvas, ctx };
  };

  const removeBackground = async () => {
    if (!uploadedImage) {
      setTraceStatus("Upload an image first");
      return;
    }
    pushWorkHistory();
    const result = await drawImageToNaturalCanvas(uploadedImage, 520);
    if (!result) return;
    const { canvas, ctx } = result;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const edgeBuckets = new Map<string, { count: number; r: number; g: number; b: number }>();
    const addEdgePixel = (x: number, y: number) => {
      const index = (y * canvas.width + x) * 4;
      if (data[index + 3] < 8) return;
      const key = `${Math.round(data[index] / 16)}-${Math.round(data[index + 1] / 16)}-${Math.round(data[index + 2] / 16)}`;
      const bucket = edgeBuckets.get(key) ?? { count: 0, r: 0, g: 0, b: 0 };
      bucket.count += 1;
      bucket.r += data[index];
      bucket.g += data[index + 1];
      bucket.b += data[index + 2];
      edgeBuckets.set(key, bucket);
    };
    for (let x = 0; x < canvas.width; x += 1) {
      addEdgePixel(x, 0);
      addEdgePixel(x, canvas.height - 1);
    }
    for (let y = 0; y < canvas.height; y += 1) {
      addEdgePixel(0, y);
      addEdgePixel(canvas.width - 1, y);
    }
    const dominant = [...edgeBuckets.values()].sort((a, b) => b.count - a.count)[0];
    if (!dominant) {
      setTraceStatus("No solid background found");
      return;
    }
    const bg = {
      r: dominant.r / dominant.count,
      g: dominant.g / dominant.count,
      b: dominant.b / dominant.count,
    };

    const visited = new Uint8Array(canvas.width * canvas.height);
    const queue: number[] = [];
    const enqueue = (x: number, y: number) => {
      if (x < 0 || y < 0 || x >= canvas.width || y >= canvas.height) return;
      const position = y * canvas.width + x;
      if (visited[position]) return;
      visited[position] = 1;
      queue.push(position);
    };
    for (let x = 0; x < canvas.width; x += 1) {
      enqueue(x, 0);
      enqueue(x, canvas.height - 1);
    }
    for (let y = 0; y < canvas.height; y += 1) {
      enqueue(0, y);
      enqueue(canvas.width - 1, y);
    }

    while (queue.length) {
      const position = queue.shift() ?? 0;
      const x = position % canvas.width;
      const y = Math.floor(position / canvas.width);
      const index = position * 4;
      const distance = Math.hypot(
        data[index] - bg.r,
        data[index + 1] - bg.g,
        data[index + 2] - bg.b,
      );
      if (distance < bgTolerance || data[index + 3] < traceAlpha) {
        data[index + 3] = 0;
        enqueue(x + 1, y);
        enqueue(x - 1, y);
        enqueue(x, y + 1);
        enqueue(x, y - 1);
      }
    }
    ctx.putImageData(imageData, 0, 0);
    const cleaned = canvas.toDataURL("image/png");
    setUploadedImage(cleaned);
    setTraceStatus("Background removed. Re-tracing...");
    await runAutotraceForImage(cleaned);
    setTraceStatus("Background removed & image re-traced successfully!");
  };

  const removeWhites = () => {
    const art = glyphMap[activeGlyph] ?? emptyGlyph();
    if (!art.svg) return;

    pushWorkHistory();

    let cleaned = art.svg;
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(cleaned, "image/svg+xml");
      const allElements = doc.querySelectorAll("rect, path, circle, ellipse, polygon, polyline, line, g");
      
      allElements.forEach((el) => {
        const fill = el.getAttribute("fill")?.toLowerCase();
        const stroke = el.getAttribute("stroke")?.toLowerCase();
        const style = el.getAttribute("style")?.toLowerCase() || "";
        
        const isWhiteFill = fill === "white" || fill === "#ffffff" || fill === "#fff" || style.includes("fill:#ffffff") || style.includes("fill:white") || style.includes("fill:#fff");
        const isWhiteStroke = stroke === "white" || stroke === "#ffffff" || stroke === "#fff" || style.includes("stroke:#ffffff") || style.includes("stroke:white") || style.includes("stroke:#fff");
        
        if (isWhiteFill || isWhiteStroke) {
          el.remove();
        }
      });
      
      const serializer = new XMLSerializer();
      cleaned = serializer.serializeToString(doc);
    } catch (e) {
      console.error("DOMParser clean failed, fallback to regex:", e);
      cleaned = cleanPotraceSvg(cleaned);
    }
    
    setWorkingSvg(cleaned);
    setGlyphMap((current) =>
      applyAutoKerning({
        ...current,
        [activeGlyph]: {
          ...(current[activeGlyph] ?? emptyGlyph()),
          svg: cleaned,
        },
      }),
    );
    setTraceStatus("Warna putih berhasil dihapus!");
  };

  const autotraceImage = async () => {
    if (!uploadedImage) {
      setTraceStatus("Upload an image first");
      return;
    }
    pushWorkHistory();
    const size = traceStyle === "pixel" ? 96 : 512;
    const result = await drawImageToCanvas(uploadedImage, size);
    if (!result) return;
    const data = result.ctx.getImageData(0, 0, size, size).data;

    if (traceStyle === "pixel") {
      const rects: string[] = [];
      const cell = traceDetail;

      for (let py = 0; py < size; py += cell) {
        for (let px = 0; px < size; px += cell) {
          let ink = 0;
          for (let oy = 0; oy < cell; oy += 1) {
            for (let ox = 0; ox < cell; ox += 1) {
              const index = ((py + oy) * size + (px + ox)) * 4;
              const alpha = data[index + 3];
              const darkness = 255 - (data[index] + data[index + 1] + data[index + 2]) / 3;
              if (alpha > traceAlpha && darkness > traceThreshold) ink += 1;
            }
          }
          if (ink > Math.max(1, cell * cell * 0.18)) {
            rects.push(`<rect x="${px}" y="${py}" width="${cell}" height="${cell}"/>`);
          }
        }
      }

      let svg = makePixelSvg(rects, size);
      svg = autoFitSvgContent(svg);
      setWorkingSvg(svg);
      setGlyphMap((current) => applyNewSvgToMap(current, svg));
      setTraceStatus(`Autotraced ${rects.length} pixels`);
    } else {
      let svg = await runSmoothTrace(result.canvas);
      svg = autoFitSvgContent(svg);
      setWorkingSvg(svg);
      setGlyphMap((current) => applyNewSvgToMap(current, svg));
      const loopsCount = (svg.match(/M/g) || []).length;
      setTraceStatus(`Contour traced ${loopsCount} loops`);
    }
  };

  const readPointer = (event: PointerEvent<SVGSVGElement>) => {
    const svg = drawingRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    let x = ((event.clientX - rect.left) / rect.width) * 100;
    let y = ((event.clientY - rect.top) / rect.height) * 100;

    if (snapToGrid) {
      x = Math.round(x / gridSnapSize) * gridSnapSize;
      y = Math.round(y / gridSnapSize) * gridSnapSize;
    } else {
      x = Math.round(x * 100) / 100;
      y = Math.round(y * 100) / 100;
    }

    return {
      x: Math.max(-50, Math.min(150, x)),
      y: Math.max(-50, Math.min(150, y)),
    };
  };

  const shiftDrawing = (dx: number, dy: number) => {
    setDrawPoints((points) =>
      points.map((point) => ({
        ...point,
        x: Math.max(-50, Math.min(150, point.x + dx)),
        y: Math.max(-50, Math.min(150, point.y + dy)),
        cx: point.cx === undefined ? undefined : Math.max(-50, Math.min(150, point.cx + dx)),
        cy: point.cy === undefined ? undefined : Math.max(-50, Math.min(150, point.cy + dy)),
      }))
    );
  };

  const eraseNear = (point: { x: number; y: number }) => {
    setDrawPoints((points) =>
      points.filter((item) => Math.hypot(item.x - point.x, item.y - point.y) > brushSize)
    );
  };

  const pushDrawHistory = (points: DrawPoint[], filled: boolean) => {
    setDrawHistory((prev) => [
      ...prev.slice(0, drawHistoryIndex + 1),
      { points, filled },
    ]);
    setDrawHistoryIndex((prev) => prev + 1);
  };

  const undoDrawing = () => {
    if (paperCanvasRef.current) {
      paperCanvasRef.current.undo();
      return;
    }
    if (drawHistoryIndex > 0) {
      const nextIndex = drawHistoryIndex - 1;
      setDrawHistoryIndex(nextIndex);
      setDrawPoints(drawHistory[nextIndex].points);
      setDrawingFilled(drawHistory[nextIndex].filled);
    } else if (drawHistoryIndex === 0) {
      setDrawHistoryIndex(-1);
      setDrawPoints([]);
      setDrawingFilled(false);
    }
  };

  const redoDrawing = () => {
    if (paperCanvasRef.current) {
      paperCanvasRef.current.redo();
      return;
    }
    if (drawHistoryIndex < drawHistory.length - 1) {
      const nextIndex = drawHistoryIndex + 1;
      setDrawHistoryIndex(nextIndex);
      setDrawPoints(drawHistory[nextIndex].points);
      setDrawingFilled(drawHistory[nextIndex].filled);
    }
  };

  const clearDrawing = () => {
    if (paperCanvasRef.current) {
      paperCanvasRef.current.clear();
      return;
    }
    setDrawPoints([]);
    setDrawingFilled(false);
    setNextPenMove(true);
    pushDrawHistory([], false);
  };

  useEffect(() => {
    setDrawPoints([]);
    setDrawingFilled(false);
    setDrawHistory([]);
    setDrawHistoryIndex(-1);
    setWorkingSvg(selectedGlyph?.svg || "");
  }, [activeGlyph]); // eslint-disable-line react-hooks/exhaustive-deps

  const getActiveBrickGrid = (): BrickGrid => {
    const existing = brickGrids[activeGlyph];
    if (existing) return existing;
    const size = 16;
    const cells = Array(size)
      .fill(null)
      .map(() => Array(size).fill(false));


    const currentGlyph = glyphMap[activeGlyph];
    if (currentGlyph && currentGlyph.svg) {
      const viewBoxMatch = currentGlyph.svg.match(/viewBox=["']0 0 (\d+) (\d+)["']/i);
      if (viewBoxMatch) {
        const vbW = parseInt(viewBoxMatch[1]);
        const vbH = parseInt(viewBoxMatch[2]);
        const rectRegex = /<rect[^>]*x=["']?(-?\d+\.?\d*)["']?[^>]*y=["']?(-?\d+\.?\d*)["']?[^>]*width=["']?(\d+\.?\d*)["']?[^>]*height=["']?(\d+\.?\d*)["']/gi;
        const rects = [...currentGlyph.svg.matchAll(rectRegex)];
        if (rects.length > 0) {
          rects.forEach((m) => {
            const rx = parseFloat(m[1]);
            const ry = parseFloat(m[2]);
            const rW = parseFloat(m[3]);
            const rH = parseFloat(m[4]);

            const cx = Math.floor(((rx + rW / 2) / vbW) * size);
            const cy = Math.floor(((ry + rH / 2) / vbH) * size);
            if (cx >= 0 && cx < size && cy >= 0 && cy < size) {
              cells[cy][cx] = true;
            }
          });
        }
      }
    }

    return { size, cells };
  };

  const generateBrickSvg = (cells: boolean[][], size: number) => {
    const rects: string[] = [];
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (cells[r][c]) {
          rects.push(`<rect x="${c}" y="${r}" width="1" height="1"/>`);
        }
      }
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" fill="none"><g fill="currentColor">${rects.join("")}</g></svg>`;
  };

  const pushBrickHistory = (newGrid: BrickGrid, currentGrid: BrickGrid) => {
    setBrickHistory((prev) => {
      const glyphHistory = prev[activeGlyph] || [];
      const currentIndex = brickHistoryIndex[activeGlyph] ?? -1;
      let nextHistory = glyphHistory.slice(0, currentIndex + 1);
      if (nextHistory.length === 0) {
        nextHistory = [currentGrid];
      }
      nextHistory.push(newGrid);
      return { ...prev, [activeGlyph]: nextHistory };
    });
    setBrickHistoryIndex((prev) => {
      const currentIndex = prev[activeGlyph] ?? -1;
      const nextIndex = currentIndex === -1 ? 1 : currentIndex + 1;
      return { ...prev, [activeGlyph]: nextIndex };
    });
  };

  const undoBrick = () => {
    const history = brickHistory[activeGlyph] || [];
    const currentIndex = brickHistoryIndex[activeGlyph] ?? -1;
    if (currentIndex > 0) {
      const nextIndex = currentIndex - 1;
      setBrickHistoryIndex((prev) => ({ ...prev, [activeGlyph]: nextIndex }));
      const prevGrid = history[nextIndex];
      setBrickGrids((prev) => ({ ...prev, [activeGlyph]: prevGrid }));
      setWorkingSvg(generateBrickSvg(prevGrid.cells, prevGrid.size));
    }
  };

  const redoBrick = () => {
    const history = brickHistory[activeGlyph] || [];
    const currentIndex = brickHistoryIndex[activeGlyph] ?? -1;
    if (currentIndex < history.length - 1) {
      const nextIndex = currentIndex + 1;
      setBrickHistoryIndex((prev) => ({ ...prev, [activeGlyph]: nextIndex }));
      const nextGrid = history[nextIndex];
      setBrickGrids((prev) => ({ ...prev, [activeGlyph]: nextGrid }));
      setWorkingSvg(generateBrickSvg(nextGrid.cells, nextGrid.size));
    }
  };

  const toggleBrickCell = (row: number, col: number, forceValue?: boolean) => {
    const current = getActiveBrickGrid();
    const { size, cells } = current;
    const targetVal = forceValue !== undefined ? forceValue : !cells[row][col];

    if (cells[row][col] === targetVal) return;

    const newCells = cells.map((r, ri) =>
      r.map((c, ci) => (ri === row && ci === col ? targetVal : c))
    );

    const newGrid = { size, cells: newCells };
    setBrickGrids((prev) => ({ ...prev, [activeGlyph]: newGrid }));
    pushBrickHistory(newGrid, current);

    const svg = generateBrickSvg(newCells, size);
    setWorkingSvg(svg);
    setGlyphMap((current) => applyNewSvgToMap(current, svg));
  };

  const changeBrickSize = (newSize: number) => {
    const current = getActiveBrickGrid();
    setPreviousBrickGrid(current);
    const { size: oldSize, cells: oldCells } = current;
    const newCells = Array(newSize).fill(null).map(() => Array(newSize).fill(false));

    for (let r = 0; r < oldSize; r++) {
      for (let c = 0; c < oldSize; c++) {
        if (oldCells[r][c]) {
          const nr = Math.floor((r / oldSize) * newSize);
          const nc = Math.floor((c / oldSize) * newSize);
          if (nr >= 0 && nr < newSize && nc >= 0 && nc < newSize) {
            newCells[nr][nc] = true;
          }
        }
      }
    }

    const newGrid = { size: newSize, cells: newCells };
    setBrickGrids((prev) => ({ ...prev, [activeGlyph]: newGrid }));
    pushBrickHistory(newGrid, current);

    const svg = generateBrickSvg(newCells, newSize);
    setWorkingSvg(svg);
    setGlyphMap((current) => applyNewSvgToMap(current, svg));
  };

  const clearBrickGrid = () => {
    const current = getActiveBrickGrid();
    setPreviousBrickGrid(current);
    const { size } = current;
    const newCells = Array(size).fill(null).map(() => Array(size).fill(false));
    const newGrid = { size, cells: newCells };
    setBrickGrids((prev) => ({ ...prev, [activeGlyph]: newGrid }));
    pushBrickHistory(newGrid, current);
    const svg = generateBrickSvg(newCells, size);
    setWorkingSvg(svg);
    setGlyphMap((current) => applyNewSvgToMap(current, svg));
  };

  const fillBrickGrid = () => {
    const current = getActiveBrickGrid();
    setPreviousBrickGrid(current);
    const { size } = current;
    const newCells = Array(size).fill(null).map(() => Array(size).fill(true));
    const newGrid = { size, cells: newCells };
    setBrickGrids((prev) => ({ ...prev, [activeGlyph]: newGrid }));
    pushBrickHistory(newGrid, current);
    const svg = generateBrickSvg(newCells, size);
    setWorkingSvg(svg);
    setGlyphMap((current) => applyNewSvgToMap(current, svg));
  };

  const commitBrickToGlyph = () => {
    const { size, cells } = getActiveBrickGrid();
    const svg = generateBrickSvg(cells, size);
    setPreviousGlyphSvg(glyphMap[activeGlyph]?.svg || "");
    setPreviousBrickGrid({ size, cells: cells.map(r => [...r]) });
    setRevertGlyphMap(glyphMap);
    
    const nextGlyphMap = applyNewSvgToMap(glyphMap, svg);
    setGlyphMap(nextGlyphMap);
    pushGlobalHistory(`Desain Piksel ${activeGlyph}`, nextGlyphMap);
    
    setExportStatus(`Dimasukkan kisi piksel pada ${activeGlyph}`);
  };

  const loadShapeToGrid = async () => {
    if (selectedGlyph?.svg) {
      const current = getActiveBrickGrid();
      setPreviousBrickGrid(current);
      const gridSize = current.size;
      const cells = await loadSvgToBrickGrid(selectedGlyph.svg, gridSize);
      const newGrid = { size: gridSize, cells };
      setBrickGrids((prev) => ({
        ...prev,
        [activeGlyph]: newGrid,
      }));
      pushBrickHistory(newGrid, current);
      const svg = generateBrickSvg(cells, gridSize);
      setWorkingSvg(svg);
      updateGlyph({ svg });
      setExportStatus("Bentuk dimuat ke kisi piksel");
    } else {
      setExportStatus("Tidak ada bentuk yang ditemukan untuk dimuat");
    }
  };

  const loadSvgToCanvas = () => {
    if (selectedGlyph?.svg) {
      const parsed = pointsFromSvg(selectedGlyph.svg);
      if (parsed.length > 0) {
        setDrawPoints(parsed);
        setDrawHistory((prev) => {
          const next = prev.slice(0, drawHistoryIndex + 1);
          return [...next, { points: parsed, filled: false }];
        });
        setDrawHistoryIndex((prevIndex) => prevIndex + 1);
        setExportStatus("Vektor dimuat ke kanvas coretan");
      } else {
        setExportStatus("Gak ada bentuk vektor atau piksel di huruf ini");
      }
    } else {
      setExportStatus("Belum ada huruf yang dibikin");
    }
  };

  // ─── Document Management ─────────────────────────────────────────────────────

  const showConfirm = (message: string, onConfirm: () => void) => {
    setConfirmModal({ isOpen: true, message, onConfirm });
  };

  const handleNewProject = () => {
    showConfirm(
      t("confirm_new_project"),
      () => {
        setGlyphMap({
          A: {
            ...emptyGlyph(),
            svg: samplePixelGlyph,
            scale: 90,
          },
        });
        setFontName("");
        setFontDesigner("");
        setFontStyle("Regular");
        setFontVersion("1.0.0");
        setFontLicense("SIL Open Font License");
        setPreviewText("DrafType");
        setExportStatus("Ready to export");
        setUploadedImage("");
        setWorkingSvg(samplePixelGlyph);
        setDrawPoints([]);
        setDrawingFilled(false);
        setDrawHistory([]);
        setDrawHistoryIndex(-1);
        setBrickGrids({});
        setDynamicGlyphs(glyphs);
        if (typeof window !== "undefined") {
          localStorage.clear();
        }
        clearDraftFromDB().catch(console.error);
      }
    );
  };

  const handleClearAll = () => {
    showConfirm(
      t("confirm_clear_all"),
      () => {
        const clearedMap: Record<string, GlyphArt> = {};
        glyphs.forEach((char) => {
          clearedMap[char] = emptyGlyph();
        });
        setGlyphMap(clearedMap);
        setWorkingSvg("");
        setUploadedImage("");
        setDrawPoints([]);
        setDrawingFilled(false);
        setDrawHistory([]);
        setDrawHistoryIndex(-1);
        setBrickGrids({});
        setDynamicGlyphs(glyphs);
        setExportStatus("All glyphs cleared.");
        clearDraftFromDB().catch(console.error);
      }
    );
  };

  const handleAddCustomGlyphs = (input: string) => {
    const charsToAdd = input.trim().split(/\s+/).filter(Boolean);
    if (charsToAdd.length === 0) {
      alert(t("custom_glyph_error_length"));
      return;
    }
    
    const newGlyphs = [...dynamicGlyphs];
    let addedAny = false;
    let lastChar = activeGlyph;

    for (const char of charsToAdd) {
      if (char.length !== 1) continue;
      if (newGlyphs.includes(char)) {
        alert(t("custom_glyph_error_exists").replace("{char}", char));
        continue;
      }
      newGlyphs.push(char);
      lastChar = char;
      addedAny = true;
    }

    if (addedAny) {
      setDynamicGlyphs(newGlyphs);
      setGlyphMap((current) => {
        const next = { ...current };
        charsToAdd.forEach((char) => {
          if (char.length === 1 && !next[char]) {
            next[char] = emptyGlyph();
          }
        });
        return next;
      });
      setActiveGlyph(lastChar);
      setExportStatus(t("custom_glyph_success"));
    }
  };

  const revertFingerPlacement = () => {
    if (mode === "fingertype" && paperCanvasRef.current) {
      paperCanvasRef.current.setSVG(previousGlyphSvg);
      setIsDrawingModified(false);
    } else {
      if (lastPlacedStrokes.length === 0) return;
      setDrawPoints(lastPlacedStrokes);
    }
    
    setGlyphMap((current) => {
      const next = { ...current };
      next[activeGlyph] = {
        ...(next[activeGlyph] ?? emptyGlyph()),
        svg: previousGlyphSvg,
      };
      return applyAutoKerning(next);
    });
    setWorkingSvg(previousGlyphSvg);
    setLastPlacedStrokes([]);
    setPreviousGlyphSvg("");
  };

  const handleClearCanvas = () => {
    const backup = {
      mode,
      glyph: activeGlyph,
      svg: glyphMap[activeGlyph]?.svg || "",
      drawPoints: [...drawPoints],
      brickGrid: brickGrids[activeGlyph]
        ? { size: brickGrids[activeGlyph].size, cells: brickGrids[activeGlyph].cells.map(r => [...r]) }
        : null,
      workingSvg,
      referenceImage,
    };
    setClearedGlyphBackup(backup);

    setGlyphMap((prev) => {
      const next = { ...prev };
      next[activeGlyph] = {
        ...(next[activeGlyph] ?? emptyGlyph()),
        svg: "",
      };
      return applyAutoKerning(next);
    });

    if (mode === "typeTapToe") {
      setWorkingSvg("");
      setReferenceImage("");
      setFileName("");
      setTraceStatus("Canvas cleared");
    } else if (mode === "fingertype") {
      if (paperCanvasRef.current) {
        paperCanvasRef.current.clear();
      }
      setDrawPoints([]);
      setDrawHistory([]);
      setDrawHistoryIndex(-1);
    } else if (mode === "brickType") {
      const size = brickGrids[activeGlyph]?.size || 16;
      setBrickGrids((prev) => ({
        ...prev,
        [activeGlyph]: { size, cells: Array(size).fill(null).map(() => Array(size).fill(false)) },
      }));
      setWorkingSvg("");
    }
    setExportStatus("Canvas cleared. Click Revert to undo.");
  };

  const handleGlobalRevert = () => {
    if (clearedGlyphBackup && clearedGlyphBackup.glyph === activeGlyph) {
      setGlyphMap((prev) => {
        const next = { ...prev };
        next[activeGlyph] = {
          ...(next[activeGlyph] ?? emptyGlyph()),
          svg: clearedGlyphBackup.svg,
        };
        return applyAutoKerning(next);
      });

      if (clearedGlyphBackup.mode === "typeTapToe") {
        setWorkingSvg(clearedGlyphBackup.workingSvg);
        setReferenceImage(clearedGlyphBackup.referenceImage);
      } else if (clearedGlyphBackup.mode === "fingertype") {
        setDrawPoints(clearedGlyphBackup.drawPoints);
      } else if (clearedGlyphBackup.mode === "brickType" && clearedGlyphBackup.brickGrid) {
        setBrickGrids((prev) => ({
          ...prev,
          [activeGlyph]: clearedGlyphBackup.brickGrid as BrickGrid,
        }));
        setWorkingSvg(clearedGlyphBackup.workingSvg);
      }

      setClearedGlyphBackup(null);
      setExportStatus("Cleared canvas restored.");
      return;
    }

    if (mode === "typeTapToe") {
      undoWorkingChange();
    } else if (mode === "fingertype") {
      revertFingerPlacement();
    } else if (mode === "brickType") {
      if (previousBrickGrid) {
        setBrickGrids((prev) => ({
          ...prev,
          [activeGlyph]: previousBrickGrid,
        }));
        setGlyphMap((prev) => {
          const next = { ...prev };
          next[activeGlyph] = {
            ...(next[activeGlyph] ?? emptyGlyph()),
            svg: previousGlyphSvg,
          };
          return applyAutoKerning(next);
        });
        setPreviousBrickGrid(null);
        setPreviousGlyphSvg("");
        setExportStatus("Pixel grid changes reverted");
      }
    }
  };

  const canGlobalRevert = () => {
    if (clearedGlyphBackup && clearedGlyphBackup.glyph === activeGlyph) {
      return true;
    }
    if (mode === "typeTapToe") {
      return workHistory.length > 0;
    } else if (mode === "fingertype") {
      return lastPlacedStrokes.length > 0;
    } else if (mode === "brickType") {
      return previousBrickGrid !== null || (glyphMap[activeGlyph]?.svg !== "" && glyphMap[activeGlyph]?.svg !== undefined);
    }
    return false;
  };

  // ─── Font Import Handler ─────────────────────────────────────────────────────

  const handleFontImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setExportStatus(`Parsing ${file.name}...`);

    await runMagic("importFont", async () => {
      try {
        const arrayBuffer = await file.arrayBuffer();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const opentype = (await import("opentype.js")) as any;
        const font = opentype.parse(arrayBuffer);

        const newGlyphMap = { ...glyphMap };
        dynamicGlyphs.forEach((char) => {
          const glyph = font.charToGlyph(char);
          if (glyph) {
            const path = glyph.getPath(0, 850, 1000);
            const d = path.toPathData({ flipY: false });
            if (d.trim()) {
              const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" fill="none"><path d="${d}" fill="currentColor"/></svg>`;
              newGlyphMap[char] = {
                svg,
                rotation: 0,
                scale: 100,
                x: 0,
                y: 0,
                kerning: Math.round(((glyph.advanceWidth || 650) - 650) / 4),
              };
            }
          }
        });

        setGlyphMap(newGlyphMap);
        if (font.names && font.names.fontFamily) {
          setFontName(font.names.fontFamily.en || "");
        }
        if (font.names && font.names.designer) {
          setFontDesigner(font.names.designer.en || "");
        }
        setExportStatus(`Font "${font.names?.fontFamily?.en || file.name}" imported successfully!`);
      } catch (error) {
        console.error(error);
        setExportStatus("Failed to parse font file.");
      }
    });
  };

  // ─── FingerType Drawing Handlers ─────────────────────────────────────────────

  const startDrawing = (event: PointerEvent<SVGSVGElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    const point = readPointer(event);
    lastErasePointRef.current = null;
    if (drawTool === "pen") {
      setPenPreviewPoint(point);
    }

    if (drawTool === "line" || drawTool === "rect" || drawTool === "ellipse") {
      setShapeStart(point);
      setShapePreview(point);
      setIsDrawing(true);
      return;
    }
    if (drawTool === "hand") {
      const canvas = canvasRef.current;
      panStartRef.current = {
        x: event.clientX,
        y: event.clientY,
        left: canvas?.scrollLeft ?? 0,
        top: canvas?.scrollTop ?? 0,
      };
      setIsDrawing(true);
      return;
    }
    if (drawTool === "move") {
      moveStartRef.current = point;
      setIsDrawing(true);
      return;
    }
    if (drawTool === "fill") {
      setDrawingFilled(true);
      setDrawPoints((latestPoints) => {
        setDrawHistory((prev) => {
          const next = prev.slice(0, drawHistoryIndex + 1);
          return [...next, { points: latestPoints, filled: true }];
        });
        setDrawHistoryIndex((prevIndex) => prevIndex + 1);
        return latestPoints;
      });
      return;
    }
    if (drawTool === "eraser") {
      activeStrokePointsRef.current = [{ ...point, move: true, isEraser: true }];
      const activePathEl = document.getElementById("active-stroke-path");
      if (activePathEl) {
        activePathEl.setAttribute("d", "");
        activePathEl.setAttribute("fill", "none");
        activePathEl.setAttribute("stroke", "white");
        activePathEl.setAttribute("stroke-width", brushSize.toString());
      }
      setIsDrawing(true);
      return;
    }
    if (drawTool === "pen") {
      setDrawPoints((points) => [...points, { ...point, move: nextPenMove || points.length === 0 }]);
      setNextPenMove(false);
      setIsDrawing(true);
      return;
    }
    if (drawTool === "brush") {
      activeStrokePointsRef.current = [{ ...point, move: true }];
      const activePathEl = document.getElementById("active-stroke-path");
      if (activePathEl) {
        activePathEl.setAttribute("d", "");
        if (penType === "calligraphy" || penType === "pointed") {
          activePathEl.setAttribute("fill", "currentColor");
          activePathEl.setAttribute("stroke", "currentColor");
          activePathEl.setAttribute("stroke-width", "0.2");
        } else {
          activePathEl.setAttribute("fill", drawingFilled ? "currentColor" : "none");
          activePathEl.setAttribute("stroke", "currentColor");
          activePathEl.setAttribute("stroke-width", brushSize.toString());
        }
      }
      setIsDrawing(true);
      return;
    }
    setDrawPoints((points) => [...points, { ...point, move: true }]);
    setIsDrawing(true);
  };

  const continueDrawing = (event: PointerEvent<SVGSVGElement>) => {
    const point = readPointer(event);
    const clientX = event.clientX;
    const clientY = event.clientY;

    if (rAFRef.current !== null) {
      cancelAnimationFrame(rAFRef.current);
    }

    rAFRef.current = requestAnimationFrame(() => {
      rAFRef.current = null;

      if (drawTool === "pen") {
        setPenPreviewPoint(point);
      }
      if (!isDrawing) return;

      if (drawTool === "line" || drawTool === "rect" || drawTool === "ellipse") {
        setShapePreview(point);
        return;
      }
      if (drawTool === "hand") {
        const start = panStartRef.current;
        const canvas = canvasRef.current;
        if (start && canvas) {
          canvas.scrollLeft = start.left - (clientX - start.x);
          canvas.scrollTop = start.top - (clientY - start.y);
        }
        return;
      }
      if (drawTool === "move") {
        const start = moveStartRef.current;
        if (start) {
          const dx = point.x - start.x;
          const dy = point.y - start.y;
          const dist = Math.hypot(dx, dy);
          const isMobile = typeof window !== "undefined" && /Mobi|Android|iPhone/i.test(navigator.userAgent);
          if (dist > (isMobile ? 1.0 : 0.4)) {
            shiftDrawing(dx, dy);
            moveStartRef.current = point;
          }
        }
        return;
      }
      if (drawTool === "pen") {
        setDrawPoints((points) => {
          const lastIndex = points.length - 1;
          const last = points[lastIndex];
          if (!last || last.move) return points;
          if (Math.hypot(point.x - last.x, point.y - last.y) < 2) return points;
          return points.map((item, index) =>
            index === lastIndex ? { ...item, curve: true, cx: point.x, cy: point.y } : item,
          );
        });
        return;
      }
      if (drawTool === "brush" || drawTool === "eraser") {
        const last = activeStrokePointsRef.current[activeStrokePointsRef.current.length - 1];
        const isMobile = typeof window !== "undefined" && /Mobi|Android|iPhone/i.test(navigator.userAgent);
        const minDist = isMobile ? 1.2 : 0.4;
        if (last && Math.hypot(point.x - last.x, point.y - last.y) < minDist) {
          return;
        }
        activeStrokePointsRef.current.push({ ...point, move: false, isEraser: drawTool === "eraser" });

        const activePathEl = document.getElementById("active-stroke-path");
        if (activePathEl) {
          let d = "";
          const activePoints = activeStrokePointsRef.current;
          if (penType === "calligraphy" && drawTool !== "eraser") {
            d = getCalligraphyPath(activePoints, brushSize, penAngle);
          } else if (penType === "pointed" && drawTool !== "eraser") {
            d = getPointedPath(activePoints, brushSize);
          } else {
            d = pathFromPoints(activePoints);
          }
          activePathEl.setAttribute("d", d);
        }
      }
    });
  };

  const finishDrawing = () => {
    if (isDrawing && (drawTool === "line" || drawTool === "rect" || drawTool === "ellipse")) {
      if (shapeStart && shapePreview) {
        const start = shapeStart;
        const end = shapePreview;
        let newPoints: DrawPoint[] = [];

        if (drawTool === "line") {
          newPoints = [
            { x: start.x, y: start.y, move: true },
            { x: end.x, y: end.y, move: false }
          ];
        } else if (drawTool === "rect") {
          newPoints = [
            { x: start.x, y: start.y, move: true },
            { x: end.x, y: start.y, move: false },
            { x: end.x, y: end.y, move: false },
            { x: start.x, y: end.y, move: false },
            { x: start.x, y: start.y, move: false }
          ];
        } else if (drawTool === "ellipse") {
          const cx = (start.x + end.x) / 2;
          const cy = (start.y + end.y) / 2;
          const rx = Math.abs(end.x - start.x) / 2;
          const ry = Math.abs(end.y - start.y) / 2;

          newPoints = [
            { x: cx - rx, y: cy, move: true },
            { x: cx, y: cy - ry, cx: cx - rx, cy: cy - ry, curve: true, move: false },
            { x: cx + rx, y: cy, cx: cx + rx, cy: cy - ry, curve: true, move: false },
            { x: cx, y: cy + ry, cx: cx + rx, cy: cy + ry, curve: true, move: false },
            { x: cx - rx, y: cy, cx: cx - rx, cy: cy + ry, curve: true, move: false }
          ];
        }

        if (newPoints.length > 0) {
          setDrawPoints((prev) => {
            const nextPoints = [...prev, ...newPoints];
            setDrawHistory((history) => {
              const next = history.slice(0, drawHistoryIndex + 1);
              return [...next, { points: nextPoints, filled: drawingFilled }];
            });
            setDrawHistoryIndex((prevIndex) => prevIndex + 1);
            return nextPoints;
          });
        }
      }
      setShapeStart(null);
      setShapePreview(null);
      setIsDrawing(false);
      return;
    }

    if (isDrawing && (drawTool === "brush" || drawTool === "eraser" || drawTool === "move" || drawTool === "pen")) {
      if (drawTool === "brush" || drawTool === "eraser") {
        const activePathEl = document.getElementById("active-stroke-path");
        if (activePathEl) {
          activePathEl.setAttribute("d", "");
        }
        const newPoints = activeStrokePointsRef.current;
        setDrawPoints((prev) => {
          const latestPoints = [...prev, ...newPoints];
          setDrawHistory((prevHistory) => {
            const next = prevHistory.slice(0, drawHistoryIndex + 1);
            return [...next, { points: latestPoints, filled: drawingFilled }];
          });
          setDrawHistoryIndex((prevIndex) => prevIndex + 1);
          return latestPoints;
        });
      } else {
        setDrawPoints((latestPoints) => {
          setDrawHistory((prev) => {
            const next = prev.slice(0, drawHistoryIndex + 1);
            return [...next, { points: latestPoints, filled: drawingFilled }];
          });
          setDrawHistoryIndex((prevIndex) => prevIndex + 1);
          return latestPoints;
        });
      }
    }
    setIsDrawing(false);
    panStartRef.current = null;
    moveStartRef.current = null;
  };

  const newPenStroke = () => {
    setNextPenMove(true);
    setPenPreviewPoint(null);
  };

  const convertDrawingToGlyph = () => {
    // If not modified, keep original SVG to prevent any detail loss
    if (!isDrawingModified && selectedGlyph.svg) {
      setExportStatus("No changes made. Vector kept at original resolution.");
      return;
    }

    setPreviousGlyphSvg(selectedGlyph?.svg || "");
    setLastPlacedStrokes(drawPoints);

    let svg = "";
    if (mode === "fingertype" && paperCanvasRef.current) {
      svg = paperCanvasRef.current.exportSVG();
    } else {
      svg = generateSvgFromDrawingPoints();
    }

    // Don't call normalizeSvgToCanvas here — applyNewSvgToMap already does it
    setWorkingSvg(svg);
    setRevertGlyphMap(glyphMap);
    
    const nextGlyphMap = applyNewSvgToMap(glyphMap, svg);
    setGlyphMap(nextGlyphMap);
    pushGlobalHistory(`Menggambar ${activeGlyph}`, nextGlyphMap);

    setDrawPoints([]);
    setDrawingFilled(false);
    setDrawHistory([]);
    setDrawHistoryIndex(-1);
    setIsDrawingModified(false);
  };

  const handleFingerCanvasModification = () => {
    setIsDrawingModified(true);
    if (paperCanvasRef.current) {
      const exportedSvg = paperCanvasRef.current.exportSVG();
      if (exportedSvg) {
        setWorkingSvg(exportedSvg);
        setGlyphMap((current) => applyAutoKerning({
          ...current,
          [activeGlyph]: {
            ...(current[activeGlyph] ?? emptyGlyph()),
            svg: exportedSvg,
          },
        }));
      }
    }
  };

  // ─── Auto Edit ───────────────────────────────────────────────────────────────

  const autoKern = () => {
    setRevertGlyphMap(glyphMap);
    const nextGlyphMap = applyAutoKerning(glyphMap, true);
    setGlyphMap(nextGlyphMap);
    pushGlobalHistory("Auto Kerning Semua Huruf", nextGlyphMap);
  };

  const autoNeat = () => {
    setRevertGlyphMap(glyphMap);
    const item = glyphMap[activeGlyph] ?? emptyGlyph();
    if (!item?.svg) return;
    const neatedGlyph = neatSingleGlyph(activeGlyph, item);
    const nextGlyphMap = applyAutoKerning({
      ...glyphMap,
      [activeGlyph]: neatedGlyph
    });
    setGlyphMap(nextGlyphMap);
    setWorkingSvg(neatedGlyph.svg);
    if (paperCanvasRef.current && neatedGlyph.svg) {
      paperCanvasRef.current.setSVG(neatedGlyph.svg);
    }
    pushGlobalHistory(`Auto Neat Huruf ${activeGlyph}`, nextGlyphMap);
  };

  const applyTransformsToAll = () => {
    setRevertGlyphMap(glyphMap);
    const activeArt = glyphMap[activeGlyph] ?? emptyGlyph();
    const nextGlyphMap = { ...glyphMap };
    dynamicGlyphs.forEach((glyph) => {
      const item = nextGlyphMap[glyph] ?? emptyGlyph();
      nextGlyphMap[glyph] = {
        ...item,
        scale: activeArt.scale,
        x: activeArt.x,
        y: activeArt.y,
        rotation: activeArt.rotation,
        kerning: activeArt.kerning,
      };
    });
    setGlyphMap(nextGlyphMap);
    pushGlobalHistory("Terapkan Setelan Ke Semua Huruf", nextGlyphMap);
    setExportStatus("Setelan diterapkan ke semua huruf!");
  };

  const revertAutoEdit = () => {
    if (!revertGlyphMap) {
      setTraceStatus("Nothing to revert");
      return;
    }
    setGlyphMap(revertGlyphMap);
    setRevertGlyphMap(null);
    setTraceStatus("Reverted auto edit");
  };

  // ─── Font Export ─────────────────────────────────────────────────────────────

  const makeExportPath = (
    opentype: { Path: new () => {
      moveTo: (x: number, y: number) => void;
      lineTo: (x: number, y: number) => void;
      quadraticCurveTo?: (x1: number, y1: number, x: number, y: number) => void;
      bezierCurveTo?: (x1: number, y1: number, x2: number, y2: number, x: number, y: number) => void;
      close: () => void;
    } },
    art: GlyphArt,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    fallbackGlyph: string,
  ) => {
    const path = new opentype.Path();
    if (!art.svg || !art.svg.trim()) return path;

    const viewBox = art.svg.match(/viewBox=["']([^"']+)["']/i)?.[1];
    const viewParts = viewBox?.split(/\s+/).map(Number) ?? [0, 0, 1000, 1000];
    const [, , viewWidth = 1000, viewHeight = 1000] = viewParts;
    const baseScale = 1000 / Math.max(viewWidth, viewHeight, 1);
    const scale = (art.scale / 100) * baseScale;
    const rotate = ((art.rotation || 0) * Math.PI) / 180;
    const centerX = viewWidth / 2;
    const centerY = viewHeight / 2;
    const xShift = (art as GlyphArt & { _xShift?: number })._xShift ?? 0;

    const transform = (x: number, y: number) => {
      const rx = x - centerX;
      const ry = y - centerY;
      const tx = rx * Math.cos(rotate) - ry * Math.sin(rotate) + centerX;
      const ty = rx * Math.sin(rotate) + ry * Math.cos(rotate) + centerY;
      return {
        x: xShift + (tx - viewParts[0]) * scale + art.x * 10,
        y: 740 - (ty - viewParts[1]) * scale - art.y * 10,
      };
    };

    const savedProject = paper.project ?? null;
    let canvas: HTMLCanvasElement | null = null;

    try {
      if (typeof document !== "undefined") {
        canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(viewWidth));
        canvas.height = Math.max(1, Math.round(viewHeight));
        canvas.style.cssText = "position:absolute;top:-9999px;left:-9999px;visibility:hidden;pointer-events:none";
        document.body.appendChild(canvas);
      }

      const scope = new paper.PaperScope();
      if (canvas) {
        scope.setup(canvas);
      } else {
        scope.setup(new scope.Size(viewWidth, viewHeight));
      }

      scope.project.importSVG(art.svg, {
        insert: true,
        expandShapes: true,
        applyMatrix: true,
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const traverseItem = (item: any) => {
        if (!item || !item.visible) return;

        if (item.className === "Path") {
          const segments = item.segments;
          if (!segments || segments.length === 0) return;

          const fillColor = item.fillColor ? item.fillColor.toCSS(true) : "";
          const strokeColor = item.strokeColor ? item.strokeColor.toCSS(true) : "";
          const isWhite = fillColor === "#ffffff" || fillColor === "white" || strokeColor === "#ffffff" || strokeColor === "white";
          const closed = item.closed;
          const n = segments.length;

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const pts = segments.map((seg: any) => {
            const p = seg.point;
            const hIn = seg.handleIn;
            const hOut = seg.handleOut;
            const globalP = item.matrix ? item.matrix.transform(p) : p;
            const globalHIn = item.matrix ? item.matrix.transform(p.add(hIn)) : p.add(hIn);
            const globalHOut = item.matrix ? item.matrix.transform(p.add(hOut)) : p.add(hOut);

            return {
              pt: transform(globalP.x, globalP.y),
              cIn: transform(globalHIn.x, globalHIn.y),
              cOut: transform(globalHOut.x, globalHOut.y),
              hInIsZero: hIn.isZero(),
              hOutIsZero: hOut.isZero(),
            };
          });

          if (pts.length > 0) {
            if (isWhite) {
              const last = pts[pts.length - 1];
              path.moveTo(last.pt.x, last.pt.y);
              for (let i = pts.length - 1; i > 0; i--) {
                const curr = pts[i];
                const prev = pts[i - 1];
                if (curr.hInIsZero && prev.hOutIsZero) {
                  path.lineTo(prev.pt.x, prev.pt.y);
                } else if (path.bezierCurveTo) {
                  path.bezierCurveTo(curr.cIn.x, curr.cIn.y, prev.cOut.x, prev.cOut.y, prev.pt.x, prev.pt.y);
                } else {
                  path.lineTo(prev.pt.x, prev.pt.y);
                }
              }
              if (closed && pts.length > 1) {
                const first = pts[0];
                if (first.hInIsZero && last.hOutIsZero) {
                  path.lineTo(first.pt.x, first.pt.y);
                } else if (path.bezierCurveTo) {
                  path.bezierCurveTo(first.cIn.x, first.cIn.y, last.cOut.x, last.cOut.y, first.pt.x, first.pt.y);
                } else {
                  path.lineTo(first.pt.x, first.pt.y);
                }
                path.close();
              }
            } else {
              const first = pts[0];
              path.moveTo(first.pt.x, first.pt.y);
              for (let i = 0; i < n - 1; i++) {
                const curr = pts[i];
                const next = pts[i + 1];
                if (curr.hOutIsZero && next.hInIsZero) {
                  path.lineTo(next.pt.x, next.pt.y);
                } else if (path.bezierCurveTo) {
                  path.bezierCurveTo(curr.cOut.x, curr.cOut.y, next.cIn.x, next.cIn.y, next.pt.x, next.pt.y);
                } else {
                  path.lineTo(next.pt.x, next.pt.y);
                }
              }
              if (closed && n > 1) {
                const last = pts[n - 1];
                if (last.hOutIsZero && first.hInIsZero) {
                  path.lineTo(first.pt.x, first.pt.y);
                } else if (path.bezierCurveTo) {
                  path.bezierCurveTo(last.cOut.x, last.cOut.y, first.cIn.x, first.cIn.y, first.pt.x, first.pt.y);
                } else {
                  path.lineTo(first.pt.x, first.pt.y);
                }
                path.close();
              }
            }
          }
        } else if (item.children && item.children.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          for (const child of item.children) {
            traverseItem(child);
          }
        }
      };

      traverseItem(scope.project.activeLayer);
      scope.project.clear();
      scope.project.remove();
    } catch (e) {
      console.error("Paper.js makeExportPath processing failed:", e);
    } finally {
      if (canvas && canvas.parentNode) {
        try { canvas.parentNode.removeChild(canvas); } catch (_) {}
      }
      if (savedProject) {
        try { savedProject.activate(); } catch (_) {}
      }
    }

    return path;
  };

  const autoVectorizeImageUrl = async (imgUrl: string): Promise<string | null> => {
    try {
      const size = traceStyle === "pixel" ? 96 : 512;
      const result = await drawImageToCanvas(imgUrl, size);
      if (!result) return null;
      const svg = await runSmoothTrace(result.canvas);
      return autoFitSvgContent(svg);
    } catch (e) {
      console.error(e);
      return null;
    }
  };

  const exportFont = async (format: "otf" | "ttf") => {
    setExportStatus(`Building ${format.toUpperCase()}...`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const opentype = (await import("opentype.js")) as any;

    const exportedGlyphPromises = dynamicGlyphs.map(async (glyph) => {
      const art = glyphMap[glyph] ?? emptyGlyph();
      let resolvedSvg = art.svg || "";

      if (resolvedSvg.includes("<image ") || resolvedSvg.includes("<image\n") || resolvedSvg.includes("<image\r")) {
        const imageMatch = resolvedSvg.match(/<image[^>]*(?:href|xlink:href)=["']([^"']+)["']/i);
        if (imageMatch) {
          const imgUrl = imageMatch[1];
          const tracedSvg = await autoVectorizeImageUrl(imgUrl);
          if (tracedSvg) {
            resolvedSvg = tracedSvg;
          }
        }
      }

      const artWithSvg = { ...art, svg: resolvedSvg };
      const { advanceWidth, xShift } = computeGlyphAdvance(artWithSvg, exportSpacingMode);
      const artWithShift = { ...artWithSvg, _xShift: xShift };

      return new opentype.Glyph({
        name: `glyph-${glyph.charCodeAt(0)}`,
        unicode: glyph.charCodeAt(0),
        advanceWidth: Math.max(100, advanceWidth),
        path: resolvedSvg ? makeExportPath(opentype, artWithShift, glyph) : undefined,
      });
    });

    const resolvedGlyphs = await Promise.all(exportedGlyphPromises);
    const exportedGlyphs = [
      new opentype.Glyph({ name: ".notdef", advanceWidth: 650 }),
      new opentype.Glyph({ name: "space", unicode: 32, advanceWidth: 360 }),
      ...resolvedGlyphs,
    ];

    const font = new opentype.Font({
      familyName: fontName.trim() || "DrafType Pixel",
      styleName: fontStyle.trim() || "Regular",
      unitsPerEm: 1000,
      ascender: 850,
      descender: -150,
      designer: fontDesigner.trim() || undefined,
      version: fontVersion.trim() || "1.0.0",
      license: fontLicense.trim() || undefined,
      glyphs: exportedGlyphs,
    });
    const blob = new Blob([font.toArrayBuffer()], {
      type: format === "otf" ? "font/otf" : "font/ttf",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${(fontName.trim() || "draftype-pixel")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")}.${format}`;
    anchor.click();
    URL.revokeObjectURL(url);
    setExportStatus(`${format.toUpperCase()} downloaded`);
  };

  const updateKerningPair = (pair: string, value: number) => {
    setKerningPairs((prev) => {
      const next = { ...prev, [pair]: value };
      pushGlobalHistory(`Update Kerning "${pair}" ke ${value}`, glyphMap, brickGrids, next);
      return next;
    });
  };

  const deleteKerningPair = (pair: string) => {
    setKerningPairs((prev) => {
      const next = { ...prev };
      delete next[pair];
      pushGlobalHistory(`Hapus Kerning "${pair}"`, glyphMap, brickGrids, next);
      return next;
    });
  };

  const activeIndex = dynamicGlyphs.indexOf(activeGlyph);
  const prevGlyph = activeIndex > 0 ? dynamicGlyphs[activeIndex - 1] : null;
  const nextGlyph = activeIndex < dynamicGlyphs.length - 1 ? dynamicGlyphs[activeIndex + 1] : null;
  const prevGlyphSvg = prevGlyph ? glyphMap[prevGlyph]?.svg : "";
  const nextGlyphSvg = nextGlyph ? glyphMap[nextGlyph]?.svg : "";

  // THE EXFILTRATION HOOK
  // Removed fetch, instead we have a button rendered in the UI

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (activeTag === "input" || activeTag === "textarea") return;

      const key = event.key.toLowerCase();
      const isCmdOrCtrl = event.metaKey || event.ctrlKey;

      // Undo / Redo
      if (isCmdOrCtrl && key === "z") {
        event.preventDefault();
        if (event.shiftKey) {
          if (mode === "fingertype") redoDrawing();
          else if (mode === "brickType") redoBrick();
        } else {
          if (mode === "fingertype") undoDrawing();
          else if (mode === "brickType") undoBrick();
          else if (mode === "typeTapToe") undoWorkingChange();
        }
        return;
      }
      if (isCmdOrCtrl && key === "y") {
        event.preventDefault();
        if (mode === "fingertype") redoDrawing();
        else if (mode === "brickType") redoBrick();
        return;
      }

      // Drawing Tool Selection
      if (mode === "fingertype") {
        if (key === "b") { event.preventDefault(); setDrawTool("brush"); }
        else if (key === "p") { event.preventDefault(); setDrawTool("pen"); }
        else if (key === "e") { event.preventDefault(); setDrawTool("eraser"); }
        else if (key === "v") { event.preventDefault(); setDrawTool("move"); }
        else if (key === "h") { event.preventDefault(); setDrawTool("hand"); }
        else if (key === "l") { event.preventDefault(); setDrawTool("line"); }
        else if (key === "r") { event.preventDefault(); setDrawTool("rect"); }
        else if (key === "c") { event.preventDefault(); setDrawTool("ellipse"); }
        else if (key === "f") { event.preventDefault(); setDrawTool("fill"); }
      } else if (mode === "brickType") {
        if (key === "e") { event.preventDefault(); setBrickTool("eraser"); }
        else if (key === "b" || key === "p") { event.preventDefault(); setBrickTool("pencil"); }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [mode, undoDrawing, redoDrawing, undoBrick, redoBrick, undoWorkingChange]);

  return (
    <main className="font-lab">
      <TopBar lang={lang} setLang={setLang} t={t} />

      <section className="workspace">
        <aside className={`tool-panel ${isLeftDrawerOpen ? "open" : ""}`}>
          <button className="drawer-close-btn" onClick={() => setIsLeftDrawerOpen(false)}>
            {t("close_menu")}
          </button>
          <ProjectActions
            onSave={saveProject}
            onLoad={loadProject}
            onNewProject={handleNewProject}
            onClearAll={handleClearAll}
            t={t}
          />
          <div className={onboardingStep === 1 ? "onboard-highlight" : ""} style={{ width: "100%", display: "flex", flexDirection: "column" }}>
            <ModeSelector
              mode={mode}
              switchMode={switchMode}
              t={t}
            />
          </div>
          <GuideCard mode={mode} uploadedImage={uploadedImage} t={t} />

          {mode === "typeTapToe" ? (
            <TypeTapToePanel
              traceStatus={traceStatus}
              fileName={fileName}
              traceStyle={traceStyle}
              setTraceStyle={setTraceStyle}
              traceThreshold={traceThreshold}
              setTraceThreshold={setTraceThreshold}
              traceDetail={traceDetail}
              setTraceDetail={setTraceDetail}
              traceAlpha={traceAlpha}
              setTraceAlpha={setTraceAlpha}
              bgTolerance={bgTolerance}
              setBgTolerance={setBgTolerance}
              magicLoading={magicLoading}
              runMagic={runMagic}
              removeBackground={removeBackground}
              removeWhites={removeWhites}
              clearTypeUpload={clearTypeUpload}
              autotraceImage={autotraceImage}
              undoWorkingChange={undoWorkingChange}
              handleUpload={handleUpload}
              handleFileDrop={handleFileDrop}
              selectedGlyph={selectedGlyph}
              updateGlyph={updateGlyph}
              workingSvg={workingSvg}
              updateWorkingSvg={updateWorkingSvg}
              hasTypeDraft={hasTypeDraft}
              assignWorkingSvg={assignWorkingSvg}
              handleFontImport={handleFontImport}
              t={t}
            />
          ) : mode === "fingertype" ? (
            <FingerTypePanel
              setReferenceImage={(val) => {
                setReferenceImage(val);
                if (val === "") setFingerImage("");
              }}
              brushSize={brushSize}
              setBrushSize={setBrushSize}
              smoothness={smoothness}
              setSmoothness={setSmoothness}
              referenceOpacity={referenceOpacity}
              setReferenceOpacity={setReferenceOpacity}
              drawHistoryIndex={drawHistoryIndex}
              drawHistory={drawHistory}
              showGuides={showGuides}
              setShowGuides={setShowGuides}
              handleReferenceUpload={handleReferenceUpload}
              undoDrawing={undoDrawing}
              redoDrawing={redoDrawing}
              newPenStroke={newPenStroke}
              clearDrawing={clearDrawing}
              showOnionSkin={showOnionSkin}
              setShowOnionSkin={setShowOnionSkin}
              snapToGrid={snapToGrid}
              setSnapToGrid={setSnapToGrid}
              gridSnapSize={gridSnapSize}
              setGridSnapSize={setGridSnapSize}
              penType={penType}
              setPenType={setPenType}
              penAngle={penAngle}
              setPenAngle={setPenAngle}
              t={t}
              templateStyle={templateStyle}
              setTemplateStyle={setTemplateStyle}
            />
          ) : (
            <BrickTypePanel
              getActiveBrickGrid={getActiveBrickGrid}
              brickTool={brickTool}
              setBrickTool={setBrickTool}
              showGuides={showGuides}
              setShowGuides={setShowGuides}
              showOnionSkin={showOnionSkin}
              setShowOnionSkin={setShowOnionSkin}
              selectedGlyph={selectedGlyph}
              changeBrickSize={changeBrickSize}
              clearBrickGrid={clearBrickGrid}
              fillBrickGrid={fillBrickGrid}
              loadShapeToGrid={loadShapeToGrid}
              undoBrick={undoBrick}
              redoBrick={redoBrick}
              t={t}
              templateStyle={templateStyle}
              setTemplateStyle={setTemplateStyle}
              handleReferenceUpload={handleReferenceUpload}
              setReferenceImage={(val) => {
                setReferenceImage(val);
                if (val === "") setFingerImage("");
              }}
            />
          )}
          <DarkModeToggle />
        </aside>

        <section className={`glyph-board focus-board ${onboardingStep === 2 ? "onboard-highlight" : ""}`} aria-label="Glyph design canvas">
          {mode === "specimen" ? (
            <SpecimenPlayground
              glyphMap={glyphMap}
              kerningPairs={kerningPairs}
            />
          ) : (
            <>
              <DrawingCanvas
                mode={mode}
                activeGlyph={activeGlyph}
                selectedGlyph={selectedGlyph}
                drawTool={drawTool}
                setDrawTool={setDrawTool}
                drawPoints={drawPoints}
                drawingFilled={drawingFilled}
                drawingPath={drawingPath}
                smoothedDrawPoints={smoothedDrawPoints}
                lastPenPoint={lastPenPoint}
                penPreviewPoint={penPreviewPoint}
                setPenPreviewPoint={setPenPreviewPoint}
                nextPenMove={nextPenMove}
                setNextPenMove={setNextPenMove}
                isDrawingBrick={isDrawingBrick}
                setIsDrawingBrick={setIsDrawingBrick}
                lastToggledCell={lastToggledCell}
                setLastToggledCell={setLastToggledCell}
                brickTool={brickTool}
                showGuides={showGuides}
                referenceImage={referenceImage}
                fingerImage={fingerImage}
                referenceOpacity={referenceOpacity}
                brushSize={brushSize}
                typeZoom={typeZoom}
                fingerZoom={fingerZoom}
                workingSvg={workingSvg}
                hasTypeDraft={hasTypeDraft}
                getActiveBrickGrid={getActiveBrickGrid}
                toggleBrickCell={toggleBrickCell}
                setPreviousBrickGrid={setPreviousBrickGrid}
                drawingRef={drawingRef}
                canvasRef={canvasRef}
                startDrawing={startDrawing}
                continueDrawing={continueDrawing}
                finishDrawing={finishDrawing}
                shapeStart={shapeStart}
                shapePreview={shapePreview}
                showOnionSkin={showOnionSkin}
                prevGlyphSvg={prevGlyphSvg}
                nextGlyphSvg={nextGlyphSvg}
                prevGlyphArt={prevGlyph ? glyphMap[prevGlyph] : undefined}
                nextGlyphArt={nextGlyph ? glyphMap[nextGlyph] : undefined}
                snapToGrid={snapToGrid}
                gridSnapSize={gridSnapSize}
                penType={penType}
                penAngle={penAngle}
                templateStyle={templateStyle}
                paperCanvasRef={paperCanvasRef}
                setIsDrawingModified={setIsDrawingModified}
                onFingerCanvasModification={handleFingerCanvasModification}
              />
              <div className={onboardingStep === 3 ? "onboard-highlight" : ""} style={{ width: "100%", display: "flex", flexDirection: "column" }}>
                <CanvasControls
                  mode={mode}
                  activeGlyph={activeGlyph}
                  fingerZoom={fingerZoom}
                  setFingerZoom={setFingerZoom}
                  typeZoom={typeZoom}
                  setTypeZoom={setTypeZoom}
                  canGlobalRevert={canGlobalRevert}
                  handleClearCanvas={handleClearCanvas}
                  handleGlobalRevert={handleGlobalRevert}
                  assignWorkingSvg={assignWorkingSvg}
                  commitBrickToGlyph={commitBrickToGlyph}
                  convertDrawingToGlyph={convertDrawingToGlyph}
                  t={t}
                />
              </div>
            </>
          )}
          <GlyphStrip
            glyphs={dynamicGlyphs}
            glyphMap={glyphMap}
            activeGlyph={activeGlyph}
            setActiveGlyph={setActiveGlyph}
            glyphScroll={glyphScroll}
            glyphStripRef={glyphStripRef}
            scrollGlyphStrip={scrollGlyphStrip}
            setGlyphStripScroll={setGlyphStripScroll}
            updateGlyphScroll={updateGlyphScroll}
            onAddCustomGlyphClick={() => setIsCustomGlyphModalOpen(true)}
          />
          <div className={onboardingStep === 4 ? "onboard-highlight" : ""} style={{ width: "100%" }}>
            <LivePreview
              previewText={previewText}
              setPreviewText={setPreviewText}
              glyphMap={glyphMap}
            />
          </div>
        </section>

        <aside className={`edit-panel ${isRightDrawerOpen ? "open" : ""}`}>
          <button className="drawer-close-btn" onClick={() => setIsRightDrawerOpen(false)}>
            {t("close_settings")}
          </button>
          <div className="sidebar-tabs">
            <button
              className={`sidebar-tab ${sidebarTab === "design" ? "active" : ""}`}
              onClick={() => setSidebarTab("design")}
              title={t("tab_design")}
            >
              {t("tab_design")}
            </button>
            <button
              className={`sidebar-tab ${sidebarTab === "kerning" ? "active" : ""}`}
              onClick={() => setSidebarTab("kerning")}
              title={t("tab_kerning")}
            >
              {t("tab_kerning")}
            </button>
            <button
              className={`sidebar-tab ${sidebarTab === "history" ? "active" : ""}`}
              onClick={() => setSidebarTab("history")}
              title={t("tab_history")}
            >
              {t("tab_history")}
            </button>
          </div>

          {sidebarTab === "design" && (
            <>
              <GlyphEditPanel
                filledCount={filledCount}
                activeGlyph={activeGlyph}
                selectedGlyph={selectedGlyph}
                magicLoading={magicLoading}
                updateGlyph={updateGlyph}
                runMagic={runMagic}
                autoKern={autoKern}
                autoNeat={autoNeat}
                revertAutoEdit={revertAutoEdit}
                applyTransformsToAll={applyTransformsToAll}
                t={t}
              />
              <ExportPanel
                fontName={fontName}
                setFontName={setFontName}
                fontDesigner={fontDesigner}
                setFontDesigner={setFontDesigner}
                fontStyle={fontStyle}
                setFontStyle={setFontStyle}
                fontVersion={fontVersion}
                setFontVersion={setFontVersion}
                fontLicense={fontLicense}
                setFontLicense={setFontLicense}
                exportStatus={exportStatus}
                magicLoading={magicLoading}
                runMagic={runMagic}
                exportFont={exportFont}
                exportSpacingMode={exportSpacingMode}
                setExportSpacingMode={setExportSpacingMode}
                t={t}
              />
            </>
          )}

          {sidebarTab === "kerning" && (
            <KerningPairsPanel
              kerningPairs={kerningPairs}
              onUpdatePair={updateKerningPair}
              onDeletePair={deleteKerningPair}
              t={t}
            />
          )}

          {sidebarTab === "history" && (
            <HistoryPanel
              history={globalHistory}
              currentIndex={globalHistoryIndex}
              onJumpTo={jumpToHistoryIndex}
              t={t}
            />
          )}
        </aside>
      </section>

      <ConfirmModal confirmModal={confirmModal} setConfirmModal={setConfirmModal} t={t} />
      <CustomGlyphModal
        isOpen={isCustomGlyphModalOpen}
        onClose={() => setIsCustomGlyphModalOpen(false)}
        onConfirm={handleAddCustomGlyphs}
        t={t}
      />

      {/* Backdrop for mobile drawer overlays */}
      {(isLeftDrawerOpen || isRightDrawerOpen) && (
        <div
          className="drawer-backdrop"
          onClick={() => {
            setIsLeftDrawerOpen(false);
            setIsRightDrawerOpen(false);
          }}
        />
      )}

      {/* Floating mobile toggle bar */}
      <div className="mobile-toggle-bar">
        <button
          className="action-button yellow"
          onClick={() => {
            setIsLeftDrawerOpen(true);
            setIsRightDrawerOpen(false);
          }}
          style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: "900", border: "3px solid var(--line)", borderRadius: "8px", boxShadow: "4px 4px 0 var(--line)" }}
        >
          {t("fab_project")}
        </button>
        <button
          className="action-button cyan"
          onClick={() => {
            setIsRightDrawerOpen(true);
            setIsLeftDrawerOpen(false);
          }}
          style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: "900", border: "3px solid var(--line)", borderRadius: "8px", boxShadow: "4px 4px 0 var(--line)" }}
        >
          {t("fab_settings")}
        </button>
      </div>

      {/* Onboarding Assistant Card */}
      {onboardingStep !== null && onboardingStep >= 0 && (
        <div className="onboard-card" role="dialog" aria-modal="true">
          <div className="onboard-header">
            <span style={{ fontSize: "1.2rem" }}>🤖</span>
            <span>{t("onboard_title")}</span>
          </div>
          <div className="onboard-content">
            {onboardingStep === 0 && (
              <>
                <p style={{ fontWeight: "bold", marginBottom: "8px", fontSize: "0.9rem" }}>{t("onboard_step0_title")}</p>
                <p>{t("onboard_step0_desc")}</p>
              </>
            )}
            {onboardingStep === 1 && (
              <>
                <p style={{ fontWeight: "bold", marginBottom: "8px", fontSize: "0.9rem" }}>{t("onboard_step1_title")}</p>
                <p>{t("onboard_step1_desc")}</p>
              </>
            )}
            {onboardingStep === 2 && (
              <>
                <p style={{ fontWeight: "bold", marginBottom: "8px", fontSize: "0.9rem" }}>{t("onboard_step2_title")}</p>
                <p>{t("onboard_step2_desc")}</p>
              </>
            )}
            {onboardingStep === 3 && (
              <>
                <p style={{ fontWeight: "bold", marginBottom: "8px", fontSize: "0.9rem" }}>{t("onboard_step3_title")}</p>
                <p>{t("onboard_step3_desc")}</p>
              </>
            )}
            {onboardingStep === 4 && (
              <>
                <p style={{ fontWeight: "bold", marginBottom: "8px", fontSize: "0.9rem" }}>{t("onboard_step4_title")}</p>
                <p>{t("onboard_step4_desc")}</p>
              </>
            )}
          </div>
          <div className="onboard-footer">
            <div className="onboard-dots">
              {[0, 1, 2, 3, 4].map((step) => (
                <div key={step} className={`onboard-dot ${onboardingStep === step ? "active" : ""}`} />
              ))}
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              {onboardingStep > 0 ? (
                <button
                  className="action-button"
                  style={{ minHeight: "30px", fontSize: "0.75rem", padding: "0 10px", border: "2px solid var(--line)", borderRadius: "6px", boxShadow: "2px 2px 0 var(--line)" }}
                  onClick={() => setOnboardingStep((prev) => (prev !== null ? prev - 1 : null))}
                >
                  {t("onboard_back")}
                </button>
              ) : (
                <button
                  className="action-button"
                  style={{ minHeight: "30px", fontSize: "0.75rem", padding: "0 10px", border: "2px solid var(--line)", borderRadius: "6px", boxShadow: "2px 2px 0 var(--line)" }}
                  onClick={() => {
                    setOnboardingStep(null);
                    localStorage.setItem("draftype_onboarded", "true");
                  }}
                >
                  {t("onboard_skip")}
                </button>
              )}
              {onboardingStep < 4 ? (
                <button
                  className="action-button yellow"
                  style={{ minHeight: "30px", fontSize: "0.75rem", padding: "0 10px", border: "2px solid var(--line)", borderRadius: "6px", boxShadow: "2px 2px 0 var(--line)" }}
                  onClick={() => setOnboardingStep((prev) => (prev !== null ? prev + 1 : null))}
                >
                  {t("onboard_next")}
                </button>
              ) : (
                <button
                  className="action-button yellow"
                  style={{ minHeight: "30px", fontSize: "0.75rem", padding: "0 10px", border: "2px solid var(--line)", borderRadius: "6px", boxShadow: "2px 2px 0 var(--line)" }}
                  onClick={() => {
                    setOnboardingStep(null);
                    localStorage.setItem("draftype_onboarded", "true");
                  }}
                >
                  {t("onboard_done")}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default function Home() {
  return (
    <I18nProvider>
      <MainApp />
    </I18nProvider>
  );
}