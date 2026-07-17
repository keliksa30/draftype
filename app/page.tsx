"use client";

/* eslint-disable react-hooks/set-state-in-effect */


import { ChangeEvent, PointerEvent, useMemo, useRef, useState, useEffect } from "react";

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
import DarkModeToggle from "./components/DarkModeToggle";
import HistoryPanel from "./components/HistoryPanel";
import KerningPairsPanel from "./components/KerningPairsPanel";
import SpecimenPlayground from "./components/SpecimenPlayground";

// Shared types & utilities
import { Mode, DrawTool, MagicAction, GlyphArt, DrawPoint, BrickGrid, ConfirmModalState, ClearedGlyphBackup } from "./components/types";
import {
  glyphs,
  emptyGlyph,
  makePixelSvg,
  makeImageSvg,
  samplePixelGlyph,
  cleanSvg,
  smoothPoints,
  pathFromPoints,
  pointsFromSvg,
  applyAutoKerning,
  applyAutoNeatMap,
  getGlyphWidth,
  loadSvgToBrickGrid,
  readFileAsDataUrl,
  getCalligraphyPath,
  getPointedPath,
} from "./components/constants";
import { saveDraftToDB, loadDraftFromDB, clearDraftFromDB } from "./utils/db";
import { translations, Lang } from "./utils/i18n";

export default function Home() {
  const [mode, setMode] = useState<Mode>("typeTapToe");
  const [confirmModal, setConfirmModal] = useState<ConfirmModalState>({
    isOpen: false,
    message: "",
    onConfirm: () => {},
  });
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
  const [drawPoints, setDrawPoints] = useState<DrawPoint[]>([]);
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
  const [lang, setLangState] = useState<Lang>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("draftype_lang") as Lang) ?? "id";
    }
    return "id";
  });

  const setLang = (newLang: Lang) => {
    setLangState(newLang);
    if (typeof window !== "undefined") {
      localStorage.setItem("draftype_lang", newLang);
    }
  };

  const t = (key: string): string => {
    const entry = translations[key];
    if (!entry) return key;
    return entry[lang] || key;
  };

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
  const glyphStripRef = useRef<HTMLDivElement | null>(null);
  const panStartRef = useRef<{ x: number; y: number; left: number; top: number } | null>(null);
  const moveStartRef = useRef<{ x: number; y: number } | null>(null);

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
    if (referenceImage === uploadedImage) setReferenceImage("");
    if (fingerImage === uploadedImage) setFingerImage("");
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

  const compileDrawingToSvg = (): string => {
    let innerContent = "";
    let vbW = 100;
    let vbH = 100;

    if (selectedGlyph.svg) {
      const contentMatch = selectedGlyph.svg.match(/<svg[^>]*>([\s\S]*?)<\/svg>/i);
      if (contentMatch) innerContent = contentMatch[1];
      const viewBoxMatch = selectedGlyph.svg.match(/viewBox=["']0 0 (\d+) (\d+)["']/i);
      if (viewBoxMatch) {
        vbW = parseInt(viewBoxMatch[1]);
        vbH = parseInt(viewBoxMatch[2]);
      }
    } else if (fingerImage) {
      innerContent = `<image href="${fingerImage}" x="0" y="0" width="100" height="100" preserveAspectRatio="xMidYMid meet"/>`;
    }

    if (drawingPath) {
      const scaleFactor = vbW / 100;
      const newPath = `<path d="${drawingPath}" stroke="currentColor" stroke-width="${brushSize}" stroke-linecap="round" stroke-linejoin="round" fill="${drawingFilled ? "currentColor" : "none"}"/>`;
      if (scaleFactor !== 1) {
        innerContent += `<g transform="scale(${scaleFactor})">${newPath}</g>`;
      } else {
        innerContent += newPath;
      }
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${vbW} ${vbH}" fill="none">${innerContent}</svg>`;
  };

  const compileBrickToSvg = (): string => {
    const { size, cells } = getActiveBrickGrid();
    return generateBrickSvg(cells, size);
  };

  const switchMode = async (nextMode: Mode) => {
    pushGlobalHistory(`Mode ${mode === "fingertype" ? "FingerType" : mode === "brickType" ? "BrickType" : mode} ➔ ${nextMode === "fingertype" ? "FingerType" : nextMode === "brickType" ? "BrickType" : nextMode}`);
    let currentSvg = workingSvg || selectedGlyph?.svg;

    if (mode === "fingertype" && drawPoints.length > 0) {
      currentSvg = compileDrawingToSvg();
      setWorkingSvg(currentSvg);
      setDrawPoints([]);
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
      const vectorSvg = glyphMap[activeGlyph]?.svg || "";
      setWorkingSvg(vectorSvg);
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
    const firstGlyphId = glyphs.find((g) => g !== activeGlyph && current[g]?.svg);
    const reference = firstGlyphId ? current[firstGlyphId] : null;

    const updatedGlyph = {
      ...(current[activeGlyph] ?? emptyGlyph()),
      svg,
    };

    if (reference) {
      updatedGlyph.scale = reference.scale;
      updatedGlyph.x = reference.x;
      updatedGlyph.y = reference.y;
      updatedGlyph.rotation = reference.rotation;
      updatedGlyph.kerning = reference.kerning;
      return { ...current, [activeGlyph]: updatedGlyph };
    } else {
      return applyAutoKerning({ ...current, [activeGlyph]: updatedGlyph });
    }
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

  const processUploadedFile = async (file: File) => {
    setFileName(file.name);

    if (file.type.includes("svg") || file.name.toLowerCase().endsWith(".svg")) {
      const text = await file.text();
      const cleaned = cleanSvg(text);
      setUploadedImage("");
      setWorkingSvg(cleaned);
      setGlyphMap((current) => applyNewSvgToMap(current, cleaned));
      setTraceStatus("SVG siap diedit");
      return;
    }

    const dataUrl = await readFileAsDataUrl(file);
    setUploadedImage(dataUrl);
    const imgSvg = makeImageSvg(dataUrl);
    setWorkingSvg(imgSvg);
    setGlyphMap((current) =>
      applyAutoKerning({
        ...current,
        [activeGlyph]: {
          ...(current[activeGlyph] ?? emptyGlyph()),
          svg: imgSvg,
        },
      }),
    );
    setTraceStatus("Gambar siap dimasukkan atau ditrace");
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
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, size, size);
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
    const imgSvg = makeImageSvg(cleaned);
    setWorkingSvg(imgSvg);
    setGlyphMap((current) =>
      applyAutoKerning({
        ...current,
        [activeGlyph]: {
          ...(current[activeGlyph] ?? emptyGlyph()),
          svg: imgSvg,
        },
      }),
    );
    setTraceStatus("Background removed");
  };

  const autotraceImage = async () => {
    if (!uploadedImage) {
      setTraceStatus("Upload an image first");
      return;
    }
    pushWorkHistory();
    const size = 96;
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

      const svg = makePixelSvg(rects, size);
      setWorkingSvg(svg);
      setGlyphMap((current) => applyNewSvgToMap(current, svg));
      setTraceStatus(`Autotraced ${rects.length} pixels`);
    } else {
      // Smooth Contour Autotrace (Marching Squares)
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

          // Midpoints of cell edges
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

      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" fill="none"><path d="${paths.join(
        " "
      )}" fill="currentColor" fill-rule="evenodd"/></svg>`;
      setWorkingSvg(svg);
      setGlyphMap((current) => applyNewSvgToMap(current, svg));
      setTraceStatus(`Contour traced ${paths.length} loops`);
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
      x = Math.round(x);
      y = Math.round(y);
    }

    return {
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y)),
    };
  };

  const shiftDrawing = (dx: number, dy: number) => {
    setDrawPoints((points) =>
      points.map((point) => ({
        ...point,
        x: Math.max(0, Math.min(100, point.x + dx)),
        y: Math.max(0, Math.min(100, point.y + dy)),
        cx: point.cx === undefined ? undefined : Math.max(0, Math.min(100, point.cx + dx)),
        cy: point.cy === undefined ? undefined : Math.max(0, Math.min(100, point.cy + dy)),
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
    if (drawHistoryIndex < drawHistory.length - 1) {
      const nextIndex = drawHistoryIndex + 1;
      setDrawHistoryIndex(nextIndex);
      setDrawPoints(drawHistory[nextIndex].points);
      setDrawingFilled(drawHistory[nextIndex].filled);
    }
  };

  const clearDrawing = () => {
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
        setExportStatus("All glyphs cleared.");
        clearDraftFromDB().catch(console.error);
      }
    );
  };

  const revertFingerPlacement = () => {
    if (lastPlacedStrokes.length === 0) return;
    setDrawPoints(lastPlacedStrokes);
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
        glyphs.forEach((char) => {
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
    setPenPreviewPoint(point);

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
      eraseNear(point);
      setIsDrawing(true);
      return;
    }
    if (drawTool === "pen") {
      setDrawPoints((points) => [...points, { ...point, move: nextPenMove || points.length === 0 }]);
      setNextPenMove(false);
      setIsDrawing(true);
      return;
    }
    setDrawPoints((points) => [...points, { ...point, move: true }]);
    setIsDrawing(true);
  };

  const continueDrawing = (event: PointerEvent<SVGSVGElement>) => {
    const point = readPointer(event);
    setPenPreviewPoint(point);
    if (!isDrawing) return;

    if (drawTool === "line" || drawTool === "rect" || drawTool === "ellipse") {
      setShapePreview(point);
      return;
    }
    if (drawTool === "hand") {
      const start = panStartRef.current;
      const canvas = canvasRef.current;
      if (start && canvas) {
        canvas.scrollLeft = start.left - (event.clientX - start.x);
        canvas.scrollTop = start.top - (event.clientY - start.y);
      }
      return;
    }
    if (drawTool === "move") {
      const start = moveStartRef.current;
      if (start) {
        const dx = point.x - start.x;
        const dy = point.y - start.y;
        if (dx || dy) {
          shiftDrawing(dx, dy);
          moveStartRef.current = point;
        }
      }
      return;
    }
    if (drawTool === "eraser") {
      eraseNear(point);
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
    if (drawTool === "brush") {
      setDrawPoints((points) => {
        const last = points[points.length - 1];
        if (last && Math.hypot(point.x - last.x, point.y - last.y) < 0.3) {
          return points;
        }
        return [...points, { ...point, move: false }];
      });
    }
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
      setDrawPoints((latestPoints) => {
        setDrawHistory((prev) => {
          const next = prev.slice(0, drawHistoryIndex + 1);
          return [...next, { points: latestPoints, filled: drawingFilled }];
        });
        setDrawHistoryIndex((prevIndex) => prevIndex + 1);
        return latestPoints;
      });
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
    let innerContent = "";
    let vbW = 100;
    let vbH = 100;

    setPreviousGlyphSvg(selectedGlyph?.svg || "");
    setLastPlacedStrokes(drawPoints);

    if (selectedGlyph.svg) {
      const contentMatch = selectedGlyph.svg.match(/<svg[^>]*>([\s\S]*?)<\/svg>/i);
      if (contentMatch) {
        innerContent = contentMatch[1];
      }
      const viewBoxMatch = selectedGlyph.svg.match(/viewBox=["']0 0 (\d+) (\d+)["']/i);
      if (viewBoxMatch) {
        vbW = parseInt(viewBoxMatch[1]);
        vbH = parseInt(viewBoxMatch[2]);
      }
    } else if (fingerImage) {
      innerContent = `<image href="${fingerImage}" x="0" y="0" width="100" height="100" preserveAspectRatio="xMidYMid meet"/>`;
    }

    if (drawingPath) {
      const scaleFactor = vbW / 100;
      let newPath = "";
      if (penType === "calligraphy") {
        const calligD = getCalligraphyPath(smoothedDrawPoints, brushSize, penAngle);
        newPath = `<path d="${calligD}" fill="currentColor" stroke="currentColor" stroke-width="0.2"/>`;
      } else if (penType === "pointed") {
        const pointedD = getPointedPath(smoothedDrawPoints, brushSize);
        newPath = `<path d="${pointedD}" fill="currentColor" stroke="currentColor" stroke-width="0.2"/>`;
      } else {
        newPath = `<path d="${drawingPath}" stroke="currentColor" stroke-width="${brushSize}" stroke-linecap="round" stroke-linejoin="round" fill="${drawingFilled ? "currentColor" : "none"}"/>`;
      }
      if (scaleFactor !== 1) {
        innerContent += `<g transform="scale(${scaleFactor})">${newPath}</g>`;
      } else {
        innerContent += newPath;
      }
    }

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${vbW} ${vbH}" fill="none">${innerContent}</svg>`;
    setWorkingSvg(svg);
    setRevertGlyphMap(glyphMap);
    
    const nextGlyphMap = applyNewSvgToMap(glyphMap, svg);
    setGlyphMap(nextGlyphMap);
    pushGlobalHistory(`Menggambar ${activeGlyph}`, nextGlyphMap);

    setDrawPoints([]);
    setDrawingFilled(false);
  };

  // ─── Auto Edit ───────────────────────────────────────────────────────────────

  const autoKern = () => {
    setRevertGlyphMap(glyphMap);
    const nextGlyphMap = applyAutoKerning(glyphMap);
    setGlyphMap(nextGlyphMap);
    pushGlobalHistory("Auto Kerning Semua Huruf", nextGlyphMap);
  };

  const autoNeat = () => {
    setRevertGlyphMap(glyphMap);
    const nextGlyphMap = applyAutoNeatMap(glyphMap);
    setGlyphMap(nextGlyphMap);
    pushGlobalHistory("Auto Neat Semua Huruf", nextGlyphMap);
  };

  const applyTransformsToAll = () => {
    setRevertGlyphMap(glyphMap);
    const activeArt = glyphMap[activeGlyph] ?? emptyGlyph();
    const nextGlyphMap = { ...glyphMap };
    glyphs.forEach((glyph) => {
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

  const addRectToPath = (
    path: {
      moveTo: (x: number, y: number) => void;
      lineTo: (x: number, y: number) => void;
      close: () => void;
    },
    x: number,
    y: number,
    width: number,
    height: number,
  ) => {
    path.moveTo(x, y);
    path.lineTo(x + width, y);
    path.lineTo(x + width, y - height);
    path.lineTo(x, y - height);
    path.close();
  };

  const makeExportPath = (
    opentype: { Path: new () => {
      moveTo: (x: number, y: number) => void;
      lineTo: (x: number, y: number) => void;
      quadraticCurveTo?: (x1: number, y1: number, x: number, y: number) => void;
      bezierCurveTo?: (x1: number, y1: number, x2: number, y2: number, x: number, y: number) => void;
      close: () => void;
    } },
    art: GlyphArt,
    fallbackGlyph: string,
  ) => {
    const path = new opentype.Path();
    const viewBox = art.svg.match(/viewBox=["']([^"']+)["']/i)?.[1];
    const viewParts = viewBox?.split(/\s+/).map(Number) ?? [0, 0, 100, 100];
    const [, , viewWidth = 100, viewHeight = 100] = viewParts;
    const scale = (art.scale / 100) * (700 / Math.max(viewWidth, viewHeight, 1));
    const rotate = (art.rotation * Math.PI) / 180;
    const centerX = viewWidth / 2;
    const centerY = viewHeight / 2;

    const transform = (x: number, y: number) => {
      const rx = x - centerX;
      const ry = y - centerY;
      const tx = rx * Math.cos(rotate) - ry * Math.sin(rotate) + centerX;
      const ty = rx * Math.sin(rotate) + ry * Math.cos(rotate) + centerY;
      return {
        x: 150 + (tx - viewParts[0]) * scale + art.x * 5,
        y: 790 - (ty - viewParts[1]) * scale - art.y * 5,
      };
    };

    const drawCircle = (cx: number, cy: number, r: number, isWhite = false) => {
      const k = r * 0.5522848;
      path.moveTo(cx, cy - r);
      if (path.bezierCurveTo) {
        if (isWhite) {
          path.bezierCurveTo(cx - k, cy - r, cx - r, cy - k, cx - r, cy);
          path.bezierCurveTo(cx - r, cy + k, cx - k, cy + r, cx, cy + r);
          path.bezierCurveTo(cx + k, cy + r, cx + r, cy + k, cx + r, cy);
          path.bezierCurveTo(cx + r, cy - k, cx + k, cy - r, cx, cy - r);
        } else {
          path.bezierCurveTo(cx + k, cy - r, cx + r, cy - k, cx + r, cy);
          path.bezierCurveTo(cx + r, cy + k, cx + k, cy + r, cx, cy + r);
          path.bezierCurveTo(cx - k, cy + r, cx - r, cy + k, cx - r, cy);
          path.bezierCurveTo(cx - r, cy - k, cx - k, cy - r, cx, cy - r);
        }
      } else {
        path.lineTo(cx + r, cy - r); path.lineTo(cx + r, cy + r); path.lineTo(cx - r, cy + r); path.lineTo(cx - r, cy - r);
      }
      path.close();
    };

    const drawThickSegment = (p1: {x:number, y:number}, p2: {x:number, y:number}, thickness: number, isWhite = false) => {
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      if (Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1) return;
      const len = Math.hypot(dx, dy);
      const nx = (dy / len) * (thickness / 2);
      const ny = (-dx / len) * (thickness / 2);
      if (isWhite) {
        path.moveTo(p1.x + nx, p1.y + ny);
        path.lineTo(p1.x - nx, p1.y - ny);
        path.lineTo(p2.x - nx, p2.y - ny);
        path.lineTo(p2.x + nx, p2.y + ny);
      } else {
        path.moveTo(p1.x + nx, p1.y + ny);
        path.lineTo(p2.x + nx, p2.y + ny);
        path.lineTo(p2.x - nx, p2.y - ny);
        path.lineTo(p1.x - nx, p1.y - ny);
      }
      path.close();
      
      // Perfectly round joints to smooth out strokes
      drawCircle(p1.x, p1.y, thickness / 2, isWhite);
      drawCircle(p2.x, p2.y, thickness / 2, isWhite);
    };

    let drew = false;

    // Helper to check if style indicates white (eraser or subtractive shape)
    const checkIsWhite = (tagStr: string) => {
      return tagStr.includes('stroke="#ffffff"') || 
             tagStr.includes('stroke="white"') || 
             tagStr.includes('stroke="#fff"') || 
             tagStr.includes('fill="#ffffff"') || 
             tagStr.includes('fill="white"') || 
             tagStr.includes('fill="#fff"');
    };

    // 1. Rectangles
    const rectPattern = /<rect[^>]*x=["']?(-?\d*\.?\d+)["']?[^>]*y=["']?(-?\d*\.?\d+)["']?[^>]*width=["']?(\d*\.?\d+)["']?[^>]*height=["']?(\d*\.?\d+)["']?[^>]*>/gi;
    for (const match of art.svg.matchAll(rectPattern)) {
      const x = Number(match[1]);
      const y = Number(match[2]);
      const width = Number(match[3]);
      const height = Number(match[4]);
      const p1 = transform(x, y);
      const p2 = transform(x + width, y);
      const p3 = transform(x + width, y + height);
      const p4 = transform(x, y + height);
      
      const isWhite = checkIsWhite(match[0]);
      if (isWhite) {
        path.moveTo(p1.x, p1.y); path.lineTo(p4.x, p4.y); path.lineTo(p3.x, p3.y); path.lineTo(p2.x, p2.y); path.close();
      } else {
        path.moveTo(p1.x, p1.y); path.lineTo(p2.x, p2.y); path.lineTo(p3.x, p3.y); path.lineTo(p4.x, p4.y); path.close();
      }
      drew = true;
    }

    // 2. Lines
    const linePattern = /<line[^>]*x1=["']?(-?\d*\.?\d+)["']?[^>]*y1=["']?(-?\d*\.?\d+)["']?[^>]*x2=["']?(-?\d*\.?\d+)["']?[^>]*y2=["']?(-?\d*\.?\d+)["']?[^>]*>/gi;
    for (const match of art.svg.matchAll(linePattern)) {
      const p1 = transform(Number(match[1]), Number(match[2]));
      const p2 = transform(Number(match[3]), Number(match[4]));
      const swMatch = match[0].match(/stroke-width=["']?(\d*\.?\d+)["']?/);
      const sw = swMatch ? Number(swMatch[1]) * scale : 10 * scale;
      const isWhite = checkIsWhite(match[0]);
      drawThickSegment(p1, p2, sw, isWhite);
      drew = true;
    }

    // 3. Ellipses & Circles
    const ellipsePattern = /<(?:ellipse|circle)[^>]*cx=["']?(-?\d*\.?\d+)["']?[^>]*cy=["']?(-?\d*\.?\d+)["']?[^>]*(?:rx=["']?(\d*\.?\d+)["']?[^>]*ry=["']?(\d*\.?\d+)["']?|r=["']?(\d*\.?\d+)["'])[^>]*>/gi;
    for (const match of art.svg.matchAll(ellipsePattern)) {
      const cx = Number(match[1]);
      const cy = Number(match[2]);
      const rx = Number(match[3] ?? match[5]);
      const ry = Number(match[4] ?? match[5]);
      const K = 0.5522848;
      const dx = rx * K;
      const dy = ry * K;
      const p1 = transform(cx, cy - ry);
      const c1 = transform(cx + dx, cy - ry);
      const c2 = transform(cx + rx, cy - dy);
      const p2 = transform(cx + rx, cy);
      const c3 = transform(cx + rx, cy + dy);
      const c4 = transform(cx + dx, cy + ry);
      const p3 = transform(cx, cy + ry);
      const c5 = transform(cx - dx, cy + ry);
      const c6 = transform(cx - rx, cy + dy);
      const p4 = transform(cx - rx, cy);
      const c7 = transform(cx - rx, cy - dy);
      const c8 = transform(cx - dx, cy - ry);
      
      const isWhite = checkIsWhite(match[0]);
      path.moveTo(p1.x, p1.y);
      if (path.bezierCurveTo) {
        if (isWhite) {
          path.bezierCurveTo(c8.x, c8.y, c7.x, c7.y, p4.x, p4.y);
          path.bezierCurveTo(c6.x, c6.y, c5.x, c5.y, p3.x, p3.y);
          path.bezierCurveTo(c4.x, c4.y, c3.x, c3.y, p2.x, p2.y);
          path.bezierCurveTo(c2.x, c2.y, c1.x, c1.y, p1.x, p1.y);
        } else {
          path.bezierCurveTo(c1.x, c1.y, c2.x, c2.y, p2.x, p2.y);
          path.bezierCurveTo(c3.x, c3.y, c4.x, c4.y, p3.x, p3.y);
          path.bezierCurveTo(c5.x, c5.y, c6.x, c6.y, p4.x, p4.y);
          path.bezierCurveTo(c7.x, c7.y, c8.x, c8.y, p1.x, p1.y);
        }
      } else {
        path.lineTo(p2.x, p2.y); path.lineTo(p3.x, p3.y); path.lineTo(p4.x, p4.y); path.lineTo(p1.x, p1.y);
      }
      path.close();
      drew = true;
    }

    // 4. Paths
    const pathPattern = /<path[^>]*d=["']([^"']+)["'][^>]*>/gi;
    for (const match of art.svg.matchAll(pathPattern)) {
      const d = match[1];
      const isStrokeOnly = (match[0].includes('fill="none"') || match[0].includes("fill='none'")) && !match[0].includes('fill-rule="evenodd"');
      const swMatch = match[0].match(/stroke-width=["']?(\d*\.?\d+)["']?/);
      const thickness = (isStrokeOnly && swMatch) ? Number(swMatch[1]) * scale : 0;
      const isWhite = checkIsWhite(match[0]);

      interface PathSegment {
        type: 'L' | 'Q' | 'C';
        start: { x: number; y: number };
        end: { x: number; y: number };
        c1?: { x: number; y: number };
        c2?: { x: number; y: number };
      }
      
      interface PathContour {
        startPt: { x: number; y: number };
        segments: PathSegment[];
        closed: boolean;
      }
      
      const contours: PathContour[] = [];
      let currentContour: PathContour | null = null;
      let currX = 0; let currY = 0;
      let startX = 0; let startY = 0;
      let lastP = { x: 0, y: 0 };

      const regex = /([MmLlHhVvQqCcZz])\s*([0-9eE\s,.-]*)/g;
      let cmdMatch;

      while ((cmdMatch = regex.exec(d)) !== null) {
        const cmd = cmdMatch[1];
        const argsStr = cmdMatch[2] || "";
        const argMatches = argsStr.match(/-?[0-9]*\.?[0-9]+(?:[eE][-+]?[0-9]+)?/g);
        const args = argMatches ? argMatches.map(Number) : [];
        
        if (cmd === 'M' || cmd === 'm') {
          const isRel = cmd === 'm';
          for (let i = 0; i < args.length; i += 2) {
            if (i + 1 >= args.length) break;
            let x = args[i]; let y = args[i+1];
            if (isRel) { x += currX; y += currY; }
            currX = x; currY = y;
            const pt = transform(x, y);
            if (i === 0) {
              startX = x; startY = y;
              if (currentContour) contours.push(currentContour);
              currentContour = { startPt: pt, segments: [], closed: false };
            } else {
              if (currentContour) {
                currentContour.segments.push({ type: 'L', start: lastP, end: pt });
              }
            }
            lastP = pt;
          }
        } else if (cmd === 'L' || cmd === 'l') {
          const isRel = cmd === 'l';
          for (let i = 0; i < args.length; i += 2) {
            if (i + 1 >= args.length) break;
            let x = args[i]; let y = args[i+1];
            if (isRel) { x += currX; y += currY; }
            currX = x; currY = y;
            const pt = transform(x, y);
            if (currentContour) {
              currentContour.segments.push({ type: 'L', start: lastP, end: pt });
            }
            lastP = pt;
          }
        } else if (cmd === 'H' || cmd === 'h') {
          const isRel = cmd === 'h';
          for (let i = 0; i < args.length; i++) {
            let x = args[i];
            if (isRel) x += currX;
            currX = x;
            const pt = transform(currX, currY);
            if (currentContour) {
              currentContour.segments.push({ type: 'L', start: lastP, end: pt });
            }
            lastP = pt;
          }
        } else if (cmd === 'V' || cmd === 'v') {
          const isRel = cmd === 'v';
          for (let i = 0; i < args.length; i++) {
            let y = args[i];
            if (isRel) y += currY;
            currY = y;
            const pt = transform(currX, currY);
            if (currentContour) {
              currentContour.segments.push({ type: 'L', start: lastP, end: pt });
            }
            lastP = pt;
          }
        } else if (cmd === 'Q' || cmd === 'q') {
          const isRel = cmd === 'q';
          for (let i = 0; i < args.length; i += 4) {
            if (i + 3 >= args.length) break;
            let cx = args[i]; let cy = args[i+1];
            let x = args[i+2]; let y = args[i+3];
            if (isRel) { cx += currX; cy += currY; x += currX; y += currY; }
            currX = x; currY = y;
            const cpt = transform(cx, cy);
            const pt = transform(x, y);
            if (currentContour) {
              currentContour.segments.push({ type: 'Q', start: lastP, end: pt, c1: cpt });
            }
            lastP = pt;
          }
        } else if (cmd === 'C' || cmd === 'c') {
          const isRel = cmd === 'c';
          for (let i = 0; i < args.length; i += 6) {
            if (i + 5 >= args.length) break;
            let cx1 = args[i]; let cy1 = args[i+1];
            let cx2 = args[i+2]; let cy2 = args[i+3];
            let x = args[i+4]; let y = args[i+5];
            if (isRel) { cx1+=currX; cy1+=currY; cx2+=currX; cy2+=currY; x+=currX; y+=currY; }
            currX = x; currY = y;
            const c1 = transform(cx1, cy1);
            const c2 = transform(cx2, cy2);
            const pt = transform(x, y);
            if (currentContour) {
              currentContour.segments.push({ type: 'C', start: lastP, end: pt, c1, c2 });
            }
            lastP = pt;
          }
        } else if (cmd === 'Z' || cmd === 'z') {
          currX = startX; currY = startY;
          if (currentContour) {
            currentContour.closed = true;
            const startPt = currentContour.startPt;
            if (Math.hypot(lastP.x - startPt.x, lastP.y - startPt.y) > 0.01) {
              currentContour.segments.push({ type: 'L', start: lastP, end: startPt });
            }
            lastP = startPt;
          }
        }
      }
      if (currentContour) contours.push(currentContour);

      if (thickness > 0) {
        contours.forEach((contour) => {
          contour.segments.forEach((seg) => {
            if (seg.type === 'L') {
              drawThickSegment(seg.start, seg.end, thickness, isWhite);
            } else if (seg.type === 'Q' && seg.c1) {
              let prev = seg.start;
              for (let t = 0.1; t <= 1; t += 0.1) {
                const u = 1 - t;
                const nx = u * u * seg.start.x + 2 * u * t * seg.c1.x + t * t * seg.end.x;
                const ny = u * u * seg.start.y + 2 * u * t * seg.c1.y + t * t * seg.end.y;
                const nextP = { x: nx, y: ny };
                drawThickSegment(prev, nextP, thickness, isWhite);
                prev = nextP;
              }
            } else if (seg.type === 'C' && seg.c1 && seg.c2) {
              let prev = seg.start;
              for (let t = 0.1; t <= 1; t += 0.1) {
                const u = 1 - t;
                const nx = u * u * u * seg.start.x + 3 * u * u * t * seg.c1.x + 3 * u * t * t * seg.c2.x + t * t * t * seg.end.x;
                const ny = u * u * u * seg.start.y + 3 * u * u * t * seg.c1.y + 3 * u * t * t * seg.c2.y + t * t * t * seg.end.y;
                const nextP = { x: nx, y: ny };
                drawThickSegment(prev, nextP, thickness, isWhite);
                prev = nextP;
              }
            }
          });
        });
      } else {
        contours.forEach((contour) => {
          if (contour.segments.length === 0) return;
          if (isWhite) {
            const lastPt = contour.segments[contour.segments.length - 1].end;
            path.moveTo(lastPt.x, lastPt.y);
            for (let i = contour.segments.length - 1; i >= 0; i--) {
              const seg = contour.segments[i];
              if (seg.type === 'L') {
                path.lineTo(seg.start.x, seg.start.y);
              } else if (seg.type === 'Q' && seg.c1) {
                if (path.quadraticCurveTo) path.quadraticCurveTo(seg.c1.x, seg.c1.y, seg.start.x, seg.start.y);
                else path.lineTo(seg.start.x, seg.start.y);
              } else if (seg.type === 'C' && seg.c1 && seg.c2) {
                if (path.bezierCurveTo) path.bezierCurveTo(seg.c2.x, seg.c2.y, seg.c1.x, seg.c1.y, seg.start.x, seg.start.y);
                else path.lineTo(seg.start.x, seg.start.y);
              }
            }
            if (contour.closed) path.close();
          } else {
            path.moveTo(contour.startPt.x, contour.startPt.y);
            contour.segments.forEach((seg) => {
              if (seg.type === 'L') {
                path.lineTo(seg.end.x, seg.end.y);
              } else if (seg.type === 'Q' && seg.c1) {
                if (path.quadraticCurveTo) path.quadraticCurveTo(seg.c1.x, seg.c1.y, seg.end.x, seg.end.y);
                else path.lineTo(seg.end.x, seg.end.y);
              } else if (seg.type === 'C' && seg.c1 && seg.c2) {
                if (path.bezierCurveTo) path.bezierCurveTo(seg.c1.x, seg.c1.y, seg.c2.x, seg.c2.y, seg.end.x, seg.end.y);
                else path.lineTo(seg.end.x, seg.end.y);
              }
            });
            if (contour.closed) path.close();
          }
        });
      }
      drew = true;
    }

    if (!drew && art.svg) {
      const seed = fallbackGlyph.charCodeAt(0);
      const width = 70 + (seed % 3) * 34;
      const height = 520 + (seed % 4) * 36;
      addRectToPath(path, 190, 720, width, 95);
      addRectToPath(path, 190, 720, 95, height);
      addRectToPath(path, 190, 280, width + 180, 95);
      if (seed % 2 === 0) addRectToPath(path, 460, 720, 95, height);
    }

    return path;
  };

  const exportFont = async (format: "otf" | "ttf") => {
    setExportStatus(`Building ${format.toUpperCase()}...`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const opentype = (await import("opentype.js")) as any;
    const exportedGlyphs = [
      new opentype.Glyph({ name: ".notdef", advanceWidth: 650 }),
      new opentype.Glyph({ name: "space", unicode: 32, advanceWidth: 360 }),
      ...glyphs.map((glyph) => {
        const art = glyphMap[glyph] ?? emptyGlyph();
        return new opentype.Glyph({
          name: `glyph-${glyph.charCodeAt(0)}`,
          unicode: glyph.charCodeAt(0),
          advanceWidth: Math.round((getGlyphWidth(art.svg, 65) / 100) * 1000) + art.kerning * 4,
          path: art.svg ? makeExportPath(opentype, art, glyph) : undefined,
        });
      }),
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

  const activeIndex = glyphs.indexOf(activeGlyph);
  const prevGlyph = activeIndex > 0 ? glyphs[activeIndex - 1] : null;
  const nextGlyph = activeIndex < glyphs.length - 1 ? glyphs[activeIndex + 1] : null;
  const prevGlyphSvg = prevGlyph ? glyphMap[prevGlyph]?.svg : "";
  const nextGlyphSvg = nextGlyph ? glyphMap[nextGlyph]?.svg : "";

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
          <ModeSelector
            mode={mode}
            switchMode={switchMode}
            t={t}
          />
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
              setReferenceImage={setReferenceImage}
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
              loadSvgToCanvas={loadSvgToCanvas}
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
            />
          )}
          <DarkModeToggle />
        </aside>

        <section className="glyph-board focus-board" aria-label="Glyph design canvas">
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
              />
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
            </>
          )}
          <GlyphStrip
            glyphs={glyphs}
            glyphMap={glyphMap}
            activeGlyph={activeGlyph}
            setActiveGlyph={setActiveGlyph}
            glyphScroll={glyphScroll}
            glyphStripRef={glyphStripRef}
            scrollGlyphStrip={scrollGlyphStrip}
            setGlyphStripScroll={setGlyphStripScroll}
            updateGlyphScroll={updateGlyphScroll}
          />
          <LivePreview
            previewText={previewText}
            setPreviewText={setPreviewText}
            glyphMap={glyphMap}
          />
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
    </main>
  );
}