"use client";
 
import { createContext, useContext, useState, ReactNode } from "react";

export type Lang = "id" | "en";

interface TranslationDict {
  [key: string]: {
    id: string;
    en: string;
  };
}

export const translations: TranslationDict = {
  // TopBar
  tagline: {
    id: "BIKIN FONT GAPERNAH SEMUDAH INI",
    en: "MAKING FONTS HAS NEVER BEEN THIS EASY"
  },
  // ModeSelector
  choose_mode: {
    id: "MAU BIKIN PAKE MODE APA?",
    en: "CHOOSE YOUR CREATIVE MODE"
  },
  typetaptoe_desc: {
    id: "TypeTapToe: Unggah gambar/SVG terus trace jadi huruf",
    en: "TypeTapToe: Upload image/SVG and trace into glyphs"
  },
  typetaptoe_tooltip: {
    id: "Ubah gambar/SVG jadi huruf instan!",
    en: "Turn image/SVG into glyphs instantly!"
  },
  fingertype_desc: {
    id: "FingerType: Gambar coretan bebas sesukamu",
    en: "FingerType: Draw freehand with brush & pen"
  },
  fingertype_tooltip: {
    id: "Gambar bebas pake kuas & pena",
    en: "Draw freehand with brush & pen"
  },
  bricktype_desc: {
    id: "BrickType: Susun kotak piksel retro",
    en: "BrickType: Build retro pixel art glyphs"
  },
  bricktype_tooltip: {
    id: "Susun huruf piksel kotak-kotak",
    en: "Build retro pixel art glyphs"
  },
  specimen_desc: {
    id: "Specimen: Uji paragraf & keterbacaan font",
    en: "Specimen: Test paragraph & font readability"
  },
  specimen_tooltip: {
    id: "Uji paragraf & keterbacaan font",
    en: "Test paragraph & font readability"
  },
  // CanvasControls
  clear_btn: {
    id: "Clear",
    en: "Clear"
  },
  place_btn: {
    id: "Place in",
    en: "Place in"
  },
  // TypeTapToePanel
  upload_img: {
    id: "Masukin gambar",
    en: "Upload Image"
  },
  upload_svg: {
    id: "Masukin SVG",
    en: "Upload SVG"
  },
  upload_font: {
    id: "Masukin Font (TTF/OTF)",
    en: "Import Font (TTF/OTF)"
  },
  upload_font_sub: {
    id: "Buka & edit file font",
    en: "Open & edit font files"
  },
  upload_svg_sub: {
    id: "Vektor yang bisa diedit",
    en: "Editable vector format"
  },
  remove_bg: {
    id: "Hapus Background",
    en: "Remove BG"
  },
  remove_whites: {
    id: "Hapus Warna Putih",
    en: "Remove Whites"
  },
  clear_img: {
    id: "Hapus gambar",
    en: "Clear Image"
  },
  trace_settings: {
    id: "Setelan Tracing",
    en: "Tracing Settings"
  },
  smooth: {
    id: "Halus",
    en: "Smooth"
  },
  pixel: {
    id: "Piksel",
    en: "Pixel"
  },
  ink_thickness: {
    id: "Tebal Tinta",
    en: "Ink Threshold"
  },
  detail: {
    id: "Detail",
    en: "Detail"
  },
  transparency: {
    id: "Transparansi",
    en: "Transparency"
  },
  bg_tolerance: {
    id: "Latar Belakang",
    en: "Background Tolerance"
  },
  trace_btn: {
    id: "Ubah ke Vektor!",
    en: "Trace to Vector!"
  },
  undo_trace_bg: {
    id: "Undo Trace/BG",
    en: "Undo Trace/BG"
  },
  apply_place_in: {
    id: "Terapkan / Place In",
    en: "Apply / Place In"
  },
  // FingerTypePanel
  upload_ref: {
    id: "Masukin referensi",
    en: "Upload Reference"
  },
  clear_ref: {
    id: "Bersihin referensi",
    en: "Clear Reference"
  },
  open_vector_canvas: {
    id: "Buka Vektor di Kanvas",
    en: "Load SVG to Canvas"
  },
  undo_line: {
    id: "Undo Garis",
    en: "Undo Line"
  },
  redo_line: {
    id: "Redo Garis",
    en: "Redo Line"
  },
  brush_nib: {
    id: "Kuas / Nib",
    en: "Brush / Nib"
  },
  smoothness_slider: {
    id: "Halus",
    en: "Smoothness"
  },
  opacity_slider: {
    id: "Opasitas",
    en: "Opacity"
  },
  clear_drawing: {
    id: "Hapus coretan",
    en: "Clear Drawing"
  },
  brush_style: {
    id: "BRUSH STYLE",
    en: "BRUSH STYLE"
  },
  round: {
    id: "Bulat",
    en: "Round"
  },
  calligraphy: {
    id: "Kaligrafi",
    en: "Calligraphy"
  },
  tapered: {
    id: "Runcing",
    en: "Tapered"
  },
  nib_angle: {
    id: "Sudut Nib",
    en: "Nib Angle"
  },
  snap_to_grid: {
    id: "SNAP TO GRID",
    en: "SNAP TO GRID"
  },
  snap_active: {
    id: "Snap: Aktif",
    en: "Snap: Enabled"
  },
  snap_inactive: {
    id: "Snap: Nonaktif",
    en: "Snap: Disabled"
  },
  grid_size: {
    id: "Grid Size",
    en: "Grid Size"
  },
  new_stroke: {
    id: "Garis baru",
    en: "New stroke"
  },
  onion_skin: {
    id: "ONION SKIN",
    en: "ONION SKIN"
  },
  enable_onion_skin: {
    id: "Aktifkan Onion Skin",
    en: "Enable Onion Skin"
  },
  load_svg_to_canvas: {
    id: "Muat SVG ke Kanvas",
    en: "Load SVG to Canvas"
  },
  // BrickTypePanel
  choose_grid_size: {
    id: "Pilih Ukuran Grid",
    en: "Select Grid Size"
  },
  convert_to_pixelate: {
    id: "CONVERT TO PIXELATE",
    en: "CONVERT TO PIXELATE"
  },
  pixel_tools: {
    id: "Alat Tempur",
    en: "Pixel Tools"
  },
  pencil: {
    id: "Pensil",
    en: "Pencil"
  },
  eraser: {
    id: "Penghapus",
    en: "Eraser"
  },
  clear_grid: {
    id: "Bersihin Grid",
    en: "Clear Grid"
  },
  fill_grid: {
    id: "Isi Grid",
    en: "Fill Grid"
  },
  hide_guides: {
    id: "Sembunyiin Panduan",
    en: "Hide Guidelines"
  },
  show_guides: {
    id: "Tampilin Panduan",
    en: "Show Guidelines"
  },
  // HistoryPanel
  history_title: {
    id: "Riwayat Aksi",
    en: "Action History"
  },
  no_history: {
    id: "Belum ada riwayat aksi",
    en: "No history entries yet"
  },
  history_active: {
    id: "aktif",
    en: "active"
  },
  history_help: {
    id: "*Klik baris riwayat di atas untuk undo/redo ke titik itu.",
    en: "*Click a history entry to undo/redo to that point."
  },
  // KerningPairsPanel
  add_kerning: {
    id: "Tambah Pasangan Kerning",
    en: "Add Kerning Pair"
  },
  kerning_spacing: {
    id: "Jarak Spasi (Kerning)",
    en: "Kerning Spacing"
  },
  no_kerning: {
    id: "Belum ada pasangan kerning",
    en: "No kerning pairs added yet"
  },
  kerning_title: {
    id: "Spasi Pasangan",
    en: "Kerning Pairs"
  },
  kerning_pair: {
    id: "Pasangan Huruf",
    en: "Letter Pair"
  },
  add_btn: {
    id: "Tambah",
    en: "Add"
  },
  kerning_alert: {
    id: "Masukkan tepat 2 karakter (misal: AV, Ta, Wo)!",
    en: "Please enter exactly 2 characters (e.g. AV, Ta, Wo)!"
  },
  // Sidebar Tabs
  tab_design: {
    id: "Desain",
    en: "Design"
  },
  tab_kerning: {
    id: "Kerning",
    en: "Kerning"
  },
  tab_history: {
    id: "Riwayat",
    en: "History"
  },
  // GlyphEditPanel
  glyphs_done: {
    id: "huruf beres",
    en: "glyphs done"
  },
  stage_label: {
    id: "Huruf",
    en: "Glyph"
  },
  scale_slider: {
    id: "Skala",
    en: "Scale"
  },
  rotation_slider: {
    id: "Putar",
    en: "Rotate"
  },
  offset_x_slider: {
    id: "Geser X",
    en: "Offset X"
  },
  offset_y_slider: {
    id: "Geser Y",
    en: "Offset Y"
  },
  spacing_slider: {
    id: "Spasi",
    en: "Spacing"
  },
  auto_spacing_btn: {
    id: "Auto-spasi",
    en: "Auto-spacing"
  },
  auto_neat_btn: {
    id: "Auto-rapiin",
    en: "Auto-align"
  },
  revert_btn: {
    id: "Balikin",
    en: "Revert"
  },
  reset_all_btn: {
    id: "Balik ke Pengaturan Awal",
    en: "Reset Transforms"
  },
  apply_to_all_btn: {
    id: "Terapkan ke Semua",
    en: "Apply to All"
  },
  // ExportPanel
  font_name: {
    id: "Nama Font-mu",
    en: "Font Name"
  },
  font_name_placeholder: {
    id: "Kasih nama font-mu...",
    en: "Name your font..."
  },
  font_metadata: {
    id: "Identitas Font",
    en: "Font Identity"
  },
  font_designer: {
    id: "Siapa Pembuatnya?",
    en: "Designer Name"
  },
  font_designer_placeholder: {
    id: "Nama pembuatnya siapa...",
    en: "Who made this font..."
  },
  font_style: {
    id: "Gaya / Tebalnya",
    en: "Font Style/Weight"
  },
  font_style_placeholder: {
    id: "Regular, Bold, dll.",
    en: "Regular, Bold, etc."
  },
  font_version: {
    id: "Versinya",
    en: "Version"
  },
  font_license: {
    id: "Lisensinya",
    en: "License"
  },
  font_license_placeholder: {
    id: "Lisensinya apa...",
    en: "License details..."
  },
  export_otf: {
    id: "Ekspor ke OTF",
    en: "Export to OTF"
  },
  export_ttf: {
    id: "Ekspor ke TTF",
    en: "Export to TTF"
  },
  // Mobile drawer / FAB
  close_menu: {
    id: "✕ TUTUP MENU",
    en: "✕ CLOSE MENU"
  },
  close_settings: {
    id: "✕ TUTUP SETELAN",
    en: "✕ CLOSE SETTINGS"
  },
  fab_project: {
    id: "📂 PROYEK",
    en: "📂 PROJECT"
  },
  fab_settings: {
    id: "⚙️ SETELAN",
    en: "⚙️ SETTINGS"
  },
  // ProjectActions
  new_project: {
    id: "Mulai Baru",
    en: "New Project"
  },
  clear_all: {
    id: "Hapus Semua",
    en: "Clear All"
  },
  save_project: {
    id: "Simpan Proyek",
    en: "Save Project"
  },
  open_project: {
    id: "Buka Proyek",
    en: "Open Project"
  },
  // Status messages
  draft_restored: {
    id: "Draf proyek dipulihkan otomatis",
    en: "Project draft restored automatically"
  },
  // GuideCard
  guide_ttt_title: {
    id: "Upload gambarmu",
    en: "Upload your image"
  },
  guide_ft_title: {
    id: "Coret-coret aja di sini",
    en: "Draw freely here"
  },
  guide_bt_title: {
    id: "Susun kotak piksel",
    en: "Build pixel blocks"
  },
  guide_ttt_desc: {
    id: "PNG, JPG, atau SVG bisa langsung kamu taruh ke grid, lalu jadi font.",
    en: "Upload PNG, JPG, or SVG to the grid, then convert to font glyphs."
  },
  guide_ft_desc: {
    id: "Gambar bebas di canvas, rapikan sedikit, terus masukin ke glyph.",
    en: "Draw freehand on canvas, tidy up a bit, then place into glyphs."
  },
  guide_ft_desc_img: {
    id: "Image dari TypeTapToe kebawa ke canvas dan ikut saat kamu Place in.",
    en: "Image from TypeTapToe is loaded to canvas and included when you Place in."
  },
  guide_bt_desc: {
    id: "Buat font piksel 8-bit dengan mengeklik kisi grid secara interaktif.",
    en: "Create 8-bit pixel fonts by clicking the grid cells interactively."
  },
  confirm_new_project: {
    id: "Apakah Anda yakin ingin membuat proyek baru? Semua kemajuan saat ini akan dihapus.",
    en: "Are you sure you want to create a new project? All current progress will be lost."
  },
  confirm_clear_all: {
    id: "Yakin mau dihapus semuanya? Semua glyph yang telah Anda gambar akan dikosongkan.",
    en: "Are you sure you want to delete everything? All glyphs you drew will be cleared."
  },
  confirm_autotrace: {
    id: "Gambar terdeteksi. Apakah Anda ingin mengonversi gambar ini ke vektor (font) secara otomatis agar bisa diexport?",
    en: "Image detected. Do you want to automatically convert this image to vectors (font) so it can be exported?"
  },
  confirm_yes: {
    id: "sipp, aman",
    en: "yes, proceed"
  },
  confirm_no: {
    id: "bentar, jangan",
    en: "wait, cancel"
  },
  live_preview: {
    id: "Pratinjau langsung",
    en: "Live preview"
  },
  glyph_select_header: {
    id: "Pilih huruf yang ingin didesain di sini",
    en: "Select your glyphs here"
  },
  spacing_mode: {
    id: "Mode Spasi Ekspor",
    en: "Export Spacing Mode"
  },
  spacing_prop_title: {
    id: "Setiap huruf memiliki lebar berdasarkan konten aslinya. Cocok untuk sebagian besar font.",
    en: "Each character has advance width based on its actual pixel width + sidebearing. Best for most uses."
  },
  spacing_mono_title: {
    id: "Semua huruf memiliki lebar tetap yang sama. Tampilan retro/mesin tik klasik.",
    en: "All characters share the same fixed advance width. Classic pixel/typewriter look."
  },
  spacing_prop_desc: {
    id: "Spasi proporsional — setiap huruf menggunakan lebar sesuai kontennya",
    en: "Proportional spacing — each letter uses width based on its contents"
  },
  spacing_mono_desc: {
    id: "Spasi tetap — semua huruf sama lebar (monospace/typewriter)",
    en: "Fixed spacing — all letters share the same width (monospace/typewriter)"
  },
  guidelines_header: {
    id: "Panduan Huruf Lengkap",
    en: "Complete Glyph Guidelines"
  },
  font_size: {
    id: "Ukuran Font",
    en: "Font Size"
  },
  line_height: {
    id: "Tinggi Baris",
    en: "Line Height"
  },
  letter_spacing: {
    id: "Jarak Huruf",
    en: "Letter Spacing"
  },
  word_spacing: {
    id: "Jarak Kata",
    en: "Word Spacing"
  },
  align_paragraph: {
    id: "Rataan Paragraf",
    en: "Paragraph Alignment"
  },
  align_left: {
    id: "Kiri",
    en: "Left"
  },
  align_center: {
    id: "Tengah",
    en: "Center"
  },
  align_right: {
    id: "Kanan",
    en: "Right"
  },
  test_text_label: {
    id: "Tulis Teks Pengujian di Sini:",
    en: "Write Test Text Here:"
  },
  print_specimen_label: {
    id: "Hasil Cetak Specimen:",
    en: "Specimen Print Result:"
  },
  tool_move: { id: "Pindah", en: "Move" },
  tool_move_hint: { id: "Pindahkan gambar di dalam kotak glyph", en: "Move drawing inside glyph box" },
  tool_hand: { id: "Geser", en: "Pan" },
  tool_hand_hint: { id: "Geser area kanvas", en: "Pan canvas area" },
  tool_brush: { id: "Kuas", en: "Brush" },
  tool_brush_hint: { id: "Gambar coretan bebas", en: "Draw freehand strokes" },
  tool_pen: { id: "Pena", en: "Pen" },
  tool_pen_hint: { id: "Klik atau seret untuk membuat titik kurva", en: "Click or drag to create curve points" },
  tool_line: { id: "Garis", en: "Line" },
  tool_line_hint: { id: "Tarik garis lurus dari satu titik ke titik lain", en: "Draw a straight line between two points" },
  tool_rect: { id: "Kotak", en: "Rectangle" },
  tool_rect_hint: { id: "Buat bentuk kotak persegi panjang", en: "Draw a rectangular shape" },
  tool_ellipse: { id: "Elips", en: "Ellipse" },
  tool_ellipse_hint: { id: "Buat bentuk lingkaran atau elips", en: "Draw a circular or elliptical shape" },
  tool_eraser: { id: "Penghapus", en: "Eraser" },
  tool_eraser_hint: { id: "Hapus titik-titik terdekat", en: "Erase nearby points" },
  tool_fill: { id: "Isi", en: "Fill" },
  tool_fill_hint: { id: "Warnai bentuk saat ini dengan warna hitam", en: "Fill current shape with solid color" },
  custom_glyph_title: {
    id: "Tambah Huruf Kustom",
    en: "Add Custom Glyph"
  },
  custom_glyph_trigger: {
    id: "custom glyph? cobain deh",
    en: "custom glyph? try this"
  },
  custom_glyph_prompt: {
    id: "Masukkan karakter baru di luar 86 huruf bawaan. Maksimal 3 karakter, pisahkan dengan spasi.",
    en: "Enter new characters outside the 86 default glyphs. Max 3 characters, separated by space."
  },
  custom_glyph_success: {
    id: "Karakter berhasil ditambahkan!",
    en: "Character(s) added successfully!"
  },
  custom_glyph_error_length: {
    id: "Masukkan minimal 1 karakter!",
    en: "Please enter at least 1 character!"
  },
  custom_glyph_error_exists: {
    id: "Karakter '{char}' sudah ada dalam daftar!",
    en: "Character '{char}' is already in the list!"
  },
  // Onboarding (DrafBot)
  onboard_title: {
    id: "DrafBot — Asisten Font-mu",
    en: "DrafBot — Your Font Assistant"
  },
  onboard_step0_title: {
    id: "Selamat Datang di DrafType! 🎉",
    en: "Welcome to DrafType! 🎉"
  },
  onboard_step0_desc: {
    id: "Aku adalah asisten desain font-mu. Mari ikuti tur 1 menit untuk memahami cara merancang dan membuat font kustom pertamamu secara mudah!",
    en: "I'm your font design assistant. Let's take a 1-minute tour to easily understand how to design and build your first custom font!"
  },
  onboard_step1_title: {
    id: "Langkah 1: Pilih Mode Kreatif 🎨",
    en: "Step 1: Choose Creative Mode 🎨"
  },
  onboard_step1_desc: {
    id: "Gunakan tombol ini untuk memilih mode gambar. Kamu bisa melakukan tracing gambar/SVG (TypeTapToe), menggambar bebas (FingerType), atau membuat pixel-art 8-bit (BrickType).",
    en: "Use these buttons to select your drawing mode. You can perform image/SVG tracing (TypeTapToe), freehand drawing (FingerType), or construct 8-bit pixel-art (BrickType)."
  },
  onboard_step2_title: {
    id: "Langkah 2: Kanvas Gambar ✍️",
    en: "Step 2: Drawing Canvas ✍️"
  },
  onboard_step2_desc: {
    id: "Ini adalah kanvas utamamu. Di sini kamu bisa menggambar bentuk huruf aktifmu menggunakan kuas, pena garis, penghapus, atau template jiplakan.",
    en: "This is your main canvas. Here you can draw the shape of your active character using brush, pen, eraser, or overlay guidelines."
  },
  onboard_step3_title: {
    id: "Langkah 3: Simpan Hasil Gambar 💾",
    en: "Step 3: Save Drawing 💾"
  },
  onboard_step3_desc: {
    id: "Setelah selesai menggambar di kanvas, klik tombol \"Simpan\" (Place in...) ini agar karakter tersebut tersimpan ke dalam koleksi huruf font-mu.",
    en: "Once you finish drawing on the canvas, click this \"Place in...\" button to save the character into your font glyph collection."
  },
  onboard_step4_title: {
    id: "Langkah 4: Pratinjau & Ekspor 🚀",
    en: "Step 4: Preview & Export 🚀"
  },
  onboard_step4_desc: {
    id: "Ketik kalimat kustom di area pratinjau ini untuk mencoba font-mu secara real-time! Jika semuanya sudah siap, klik tombol Export di panel samping untuk mengunduh file font .OTF/.TTF-mu.",
    en: "Type a custom sentence in this preview area to try out your font in real-time! Once everything is ready, click the Export button in the side panel to download your .OTF/.TTF font file."
  },
  onboard_back: {
    id: "Kembali",
    en: "Back"
  },
  onboard_skip: {
    id: "Lewati",
    en: "Skip"
  },
  onboard_next: {
    id: "Lanjut",
    en: "Next"
  },
  onboard_done: {
    id: "Selesai",
    en: "Done"
  }
};

interface I18nContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
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

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
}
