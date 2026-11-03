export interface IconOption {
  class: string;
  label: string;
  category: "Pertanian" | "Teknologi" | "Sains" | "Sistem";
}

export const RESEARCH_ICONS: IconOption[] = [
  // Pertanian & Lingkungan
  { class: "fab fa-pagelines", label: "Tanaman (Pagelines)", category: "Pertanian" },
  { class: "fas fa-seedling", label: "Bibit / Tunas", category: "Pertanian" },
  { class: "fas fa-leaf", label: "Daun", category: "Pertanian" },
  { class: "fas fa-tree", label: "Pohon & Hutan", category: "Pertanian" },
  { class: "fas fa-tint", label: "Air / Hidroponik", category: "Pertanian" },
  { class: "fas fa-water", label: "Akuakultur / Akuaponik", category: "Pertanian" },
  { class: "fas fa-solar-panel", label: "Panel Surya", category: "Pertanian" },
  { class: "fas fa-sun", label: "Energi Matahari", category: "Pertanian" },

  // Teknologi & AIoT
  { class: "fas fa-robot", label: "Robotika & Otomasi", category: "Teknologi" },
  { class: "fas fa-microchip", label: "Mikrochip & Sensor IoT", category: "Teknologi" },
  { class: "fas fa-wifi", label: "Koneksi Nirkabel / IoT", category: "Teknologi" },
  { class: "fas fa-network-wired", label: "Jaringan Terhubung", category: "Teknologi" },
  { class: "fas fa-laptop-code", label: "Pemrograman & Software", category: "Teknologi" },
  { class: "fas fa-brain", label: "Artificial Intelligence (AI)", category: "Teknologi" },
  { class: "fas fa-database", label: "Big Data & Cloud", category: "Teknologi" },
  { class: "fas fa-satellite-dish", label: "Telemetri / Remote Sensing", category: "Teknologi" },

  // Sains & Laboratorium
  { class: "fas fa-flask", label: "Lab / Kimia", category: "Sains" },
  { class: "fas fa-vial", label: "Tabung Reaksi", category: "Sains" },
  { class: "fas fa-microscope", label: "Mikroskop / Analisis", category: "Sains" },
  { class: "fas fa-dna", label: "Bioteknologi / DNA", category: "Sains" },
  { class: "fas fa-atom", label: "Fisika Terapan", category: "Sains" },

  // Sistem & Manajemen
  { class: "fas fa-shield-alt", label: "Keamanan Informasi", category: "Sistem" },
  { class: "fas fa-chart-line", label: "Grafik & Pemantauan", category: "Sistem" },
  { class: "fas fa-cogs", label: "Sistem Mekanis", category: "Sistem" },
  { class: "fas fa-lightbulb", label: "Inovasi & Riset", category: "Sistem" },
];

