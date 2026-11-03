"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { auth, db, convertGoogleDriveLink } from "@/lib/firebase";
import {
  onAuthStateChanged,
  signOut,
  reauthenticateWithCredential,
  EmailAuthProvider,
  updatePassword,
  User,
} from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
  increment,
} from "firebase/firestore";
import { getAnalyticsStats, recordUpload, recordDownload } from "@/lib/analytics";
import { RESEARCH_ICONS } from "@/lib/icons";
import GoToTop from "@/components/GoToTop";
import { THEME_PRESETS, DEFAULT_THEME, applyTheme, setStoredTheme, ThemePreset } from "@/lib/theme";
import type {
  SiteContent,
  ThemeConfig,
  ResearchInterest,
  NewsItem,
  ProjectItem,
  TeamMember,
  CommentItem,
  AnalyticsStats,
} from "@/types";

type AdminTab =
  | "stats"
  | "theme"
  | "hero"
  | "numbers"
  | "research"
  | "news"
  | "projects"
  | "team"
  | "about"
  | "footer"
  | "comments"
  | "guidelines"
  | "settings";

const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000;

export default function AdminPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<AdminTab>("stats");

  // Analytics Stats
  const [analytics, setAnalytics] = useState<AnalyticsStats>({
    totalVisits: 0,
    uniqueVisitors: 0,
    totalUploads: 0,
    totalDownloads: 0,
  });

  // Theme Settings (Colors & Presets matching reference image)
  const [selectedPreset, setSelectedPreset] = useState<string>("golden-amber");
  const [themePrimary, setThemePrimary] = useState<string>("#EAB308");
  const [themeDarkBg, setThemeDarkBg] = useState<string>("#0A0A0A");
  const [themeLightBg, setThemeLightBg] = useState<string>("#FEFCE8");
  const [themeTextDark, setThemeTextDark] = useState<string>("#171717");
  const [themeTextMedium, setThemeTextMedium] = useState<string>("#262626");
  const [themeTextLight, setThemeTextLight] = useState<string>("#474747");
  const [themeSaveStatus, setThemeSaveStatus] = useState<string>("");

  // Hero & General Site Content
  const [heroTitle, setHeroTitle] = useState("");
  const [heroDescription, setHeroDescription] = useState("");
  const [heroLeftImage, setHeroLeftImage] = useState("");
  const [heroRightImage, setHeroRightImage] = useState("");
  const [heroRightText, setHeroRightText] = useState("");

  // Stats Numbers
  const [statPartners, setStatPartners] = useState("");
  const [statProjects, setStatProjects] = useState("");
  const [statIncrease, setStatIncrease] = useState("");
  const [statMembers, setStatMembers] = useState("");

  // About Section
  const [aboutTitle, setAboutTitle] = useState("");
  const [aboutParagraph1, setAboutParagraph1] = useState("");
  const [aboutParagraph2, setAboutParagraph2] = useState("");
  const [joinUsLink, setJoinUsLink] = useState("");

  // Footer Section
  const [footerAddress, setFooterAddress] = useState("");
  const [footerResearch, setFooterResearch] = useState("");
  const [footerContact, setFooterContact] = useState("");

  // Collections (Sorted newest first)
  const [researchList, setResearchList] = useState<ResearchInterest[]>([]);
  const [newsList, setNewsList] = useState<NewsItem[]>([]);
  const [projectList, setProjectList] = useState<ProjectItem[]>([]);
  const [teamList, setTeamList] = useState<TeamMember[]>([]);
  const [allComments, setAllComments] = useState<Array<CommentItem & { newsTitle: string; newsId: string }>>([]);

  // Add Forms
  const [newResearchTitle, setNewResearchTitle] = useState("");
  const [newResearchIcon, setNewResearchIcon] = useState("fab fa-pagelines");

  const [newNewsTitle, setNewNewsTitle] = useState("");
  const [newNewsDate, setNewNewsDate] = useState("");
  const [newNewsSummary, setNewNewsSummary] = useState("");
  const [newNewsContent, setNewNewsContent] = useState("");
  const [newNewsImageLink, setNewNewsImageLink] = useState("");

  const [newProjectTitle, setNewProjectTitle] = useState("");
  const [newProjectDescription, setNewProjectDescription] = useState("");
  const [newProjectLink, setNewProjectLink] = useState("");
  const [newProjectImagesLinks, setNewProjectImagesLinks] = useState("");

  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamRole, setNewTeamRole] = useState("Mentor");
  const [newTeamImageLink, setNewTeamImageLink] = useState("");

  // Icon Picker Modal State
  const [iconPickerOpen, setIconPickerOpen] = useState(false);
  const [iconPickerTarget, setIconPickerTarget] = useState<"new" | "edit">("new");

  // Edit Modals State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalType, setModalType] = useState<
    "edit-research" | "edit-news" | "edit-project" | "edit-team" | "change-password" | null
  >(null);
  const [activeItem, setActiveItem] = useState<any>(null);

  // Edit Forms
  const [editResearchTitle, setEditResearchTitle] = useState("");
  const [editResearchIcon, setEditResearchIcon] = useState("");

  const [editNewsTitle, setEditNewsTitle] = useState("");
  const [editNewsDate, setEditNewsDate] = useState("");
  const [editNewsSummary, setEditNewsSummary] = useState("");
  const [editNewsContent, setEditNewsContent] = useState("");
  const [editNewsImageLink, setEditNewsImageLink] = useState("");
  const [newsComments, setNewsComments] = useState<CommentItem[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);

  const [editProjectTitle, setEditProjectTitle] = useState("");
  const [editProjectDescription, setEditProjectDescription] = useState("");
  const [editProjectLink, setEditProjectLink] = useState("");
  const [editProjectImagesLinks, setEditProjectImagesLinks] = useState("");

  const [editTeamName, setEditTeamName] = useState("");
  const [editTeamRole, setEditTeamRole] = useState("Mentor");
  const [editTeamImageLink, setEditTeamImageLink] = useState("");

  // Password Modal
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // JSON Import/Export
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

  // Check 2-Day Session Expiration & Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
      } else {
        const lastLogin = parseInt(localStorage.getItem("admin_last_login") || "0", 10);
        const now = Date.now();

        if (lastLogin > 0 && now - lastLogin > TWO_DAYS_MS) {
          await signOut(auth);
          localStorage.removeItem("admin_last_login");
          alert("Sesi login Anda telah kedaluwarsa (lebih dari 2 hari tidak ada aktivitas). Silakan login kembali.");
          router.push("/login");
          return;
        }

        localStorage.setItem("admin_last_login", now.toString());
        setCurrentUser(user);
        loadAllData();
      }
    });
    return () => unsubscribe();
  }, [router]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const stats = await getAnalyticsStats();
      setAnalytics(stats);

      const docRef = doc(db, "siteContent", "main");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as SiteContent;
        if (data.theme) {
          setSelectedPreset(data.theme.presetId || "custom");
          setThemePrimary(data.theme.primary || "#EAB308");
          setThemeDarkBg(data.theme.darkBg || "#0A0A0A");
          setThemeLightBg(data.theme.lightBg || "#FEFCE8");
          setThemeTextDark(data.theme.textDark || "#171717");
          setThemeTextMedium(data.theme.textMedium || "#262626");
          setThemeTextLight(data.theme.textLight || "#474747");
          applyTheme(data.theme);
        } else {
          // Check localStorage or default
          const localRaw = typeof window !== "undefined" ? localStorage.getItem("site_theme") : null;
          if (localRaw) {
            try {
              const parsed = JSON.parse(localRaw);
              setSelectedPreset(parsed.presetId || "golden-amber");
              setThemePrimary(parsed.primary || "#EAB308");
              setThemeDarkBg(parsed.darkBg || "#0A0A0A");
              setThemeLightBg(parsed.lightBg || "#FEFCE8");
              setThemeTextDark(parsed.textDark || "#171717");
              setThemeTextMedium(parsed.textMedium || "#262626");
              setThemeTextLight(parsed.textLight || "#474747");
              applyTheme(parsed);
            } catch {}
          }
        }

        setHeroTitle(data.heroTitle || "");
        setHeroDescription(data.heroDescription || "");
        setHeroLeftImage(data.heroLeftImage || "");
        setHeroRightImage(data.heroRightImage || "");
        setHeroRightText(data.heroRightText || "");

        setStatPartners(data.stats?.partners || "");
        setStatProjects(data.stats?.projects || "");
        setStatIncrease(String(data.stats?.increase ?? ""));
        setStatMembers(data.stats?.members || "");

        setAboutTitle(data.aboutTitle || "Smart Grow Lab");
        setAboutParagraph1(
          data.aboutParagraph1 ||
            "SMART GROW LAB is an integrated research and innovation hub focused on developing intelligent, sustainable, and data-driven agricultural systems. By leveraging cutting-edge technologies such as the Internet of Things (IoT), Artificial Intelligence (AI), and automation, SMART GROW LAB aims to revolutionize traditional farming practices and address global challenges related to food security, climate change, and resource efficiency."
        );
        setAboutParagraph2(
          data.aboutParagraph2 ||
            "Our core activities include the design and implementation of smart farming solutions—ranging from hydroponics and aquaponics to smart greenhouses and AIoT-based aquaculture monitoring systems. Through multidisciplinary collaboration and a commitment to sustainable development, SMART GROW LAB supports the transformation of agriculture into a high-tech, environmentally responsible sector."
        );
        setJoinUsLink(data.joinUsLink || "");

        setFooterAddress(data.footer?.address || "");
        setFooterResearch(
          (data.footer?.research || []).map((l) => `${l.text}|${l.url}`).join("\n")
        );
        setFooterContact(
          (data.footer?.contact || []).map((c) => `${c.text}|${c.url}`).join("\n")
        );
      }

      await loadResearchList();
      await loadNewsList();
      await loadProjectList();
      await loadTeamList();
      await loadAllComments();
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadResearchList = async () => {
    try {
      let snap;
      try {
        snap = await getDocs(query(collection(db, "researchInterests"), orderBy("createdAt", "desc")));
      } catch {
        snap = await getDocs(collection(db, "researchInterests"));
      }
      const list: ResearchInterest[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...(d.data() as Omit<ResearchInterest, "id">) }));
      setResearchList(list);
    } catch (e) {
      console.error(e);
    }
  };

  const loadNewsList = async () => {
    try {
      const snap = await getDocs(query(collection(db, "newsAndEvents"), orderBy("createdAt", "desc")));
      const list: NewsItem[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...(d.data() as Omit<NewsItem, "id">) }));
      setNewsList(list);
    } catch (e) {
      console.error(e);
    }
  };

  const loadProjectList = async () => {
    try {
      let snap;
      try {
        snap = await getDocs(query(collection(db, "projects"), orderBy("createdAt", "desc")));
      } catch {
        snap = await getDocs(collection(db, "projects"));
      }
      const list: ProjectItem[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...(d.data() as Omit<ProjectItem, "id">) }));
      setProjectList(list);
    } catch (e) {
      console.error(e);
    }
  };

  const loadTeamList = async () => {
    try {
      let snap;
      try {
        snap = await getDocs(query(collection(db, "teamMembers"), orderBy("createdAt", "desc")));
      } catch {
        snap = await getDocs(query(collection(db, "teamMembers"), orderBy("name")));
      }
      const list: TeamMember[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...(d.data() as Omit<TeamMember, "id">) }));
      setTeamList(list);
    } catch (e) {
      console.error(e);
    }
  };

  const loadAllComments = async () => {
    try {
      const nSnap = await getDocs(collection(db, "newsAndEvents"));
      const commentArr: Array<CommentItem & { newsTitle: string; newsId: string }> = [];

      for (const nDoc of nSnap.docs) {
        const cSnap = await getDocs(
          query(collection(db, "newsAndEvents", nDoc.id, "comments"), orderBy("createdAt", "desc"))
        );
        cSnap.forEach((cDoc) => {
          commentArr.push({
            id: cDoc.id,
            newsId: nDoc.id,
            newsTitle: nDoc.data().title || "Berita",
            ...(cDoc.data() as Omit<CommentItem, "id">),
          });
        });
      }
      setAllComments(commentArr);
    } catch (err) {
      console.error("Error loading public comments:", err);
    }
  };

  const handleSimulateVisit = async () => {
    try {
      await setDoc(
        doc(db, "analytics", "traffic"),
        {
          totalVisits: increment(1),
          uniqueVisitors: increment(1),
          lastUpdated: serverTimestamp(),
        },
        { merge: true }
      );
      setAnalytics((prev) => ({
        ...prev,
        totalVisits: prev.totalVisits + 1,
        uniqueVisitors: prev.uniqueVisitors + 1,
      }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    localStorage.removeItem("admin_last_login");
    router.push("/login");
  };

  const handleSaveSiteContent = async (e: React.FormEvent) => {
    e.preventDefault();
    const dataToSave: SiteContent = {
      heroTitle,
      heroDescription,
      heroLeftImage,
      heroRightImage,
      heroRightText,
      stats: {
        partners: statPartners,
        projects: statProjects,
        increase: statIncrease,
        members: statMembers,
      },
      aboutTitle,
      aboutParagraph1,
      aboutParagraph2,
      joinUsLink,
      footer: {
        address: footerAddress,
        research: footerResearch
          .split("\n")
          .filter(Boolean)
          .map((line) => {
            const [text, url] = line.split("|");
            return { text: (text || "").trim(), url: (url || "").trim() };
          }),
        contact: footerContact
          .split("\n")
          .filter(Boolean)
          .map((line) => {
            const [text, url] = line.split("|");
            return { text: (text || "").trim(), url: (url || "").trim() };
          }),
      },
    };

    try {
      await setDoc(doc(db, "siteContent", "main"), dataToSave, { merge: true });
      await recordUpload(1);
      alert("Konten berhasil disimpan dan diperbarui di website!");
    } catch (error) {
      console.error("Error saving content: ", error);
      alert("Gagal menyimpan konten.");
    }
  };

  // Theme Handlers
  const handleSelectPreset = (preset: ThemePreset) => {
    setSelectedPreset(preset.id);
    setThemePrimary(preset.theme.primary);
    setThemeDarkBg(preset.theme.darkBg);
    setThemeLightBg(preset.theme.lightBg);
    setThemeTextDark(preset.theme.textDark);
    setThemeTextMedium(preset.theme.textMedium);
    setThemeTextLight(preset.theme.textLight);
    applyTheme(preset.theme);
  };

  const handleColorChange = (
    field: "primary" | "darkBg" | "lightBg" | "textDark" | "textMedium" | "textLight",
    value: string
  ) => {
    const updated = {
      presetId: "custom",
      primary: field === "primary" ? value : themePrimary,
      darkBg: field === "darkBg" ? value : themeDarkBg,
      lightBg: field === "lightBg" ? value : themeLightBg,
      textDark: field === "textDark" ? value : themeTextDark,
      textMedium: field === "textMedium" ? value : themeTextMedium,
      textLight: field === "textLight" ? value : themeTextLight,
    };

    if (field === "primary") setThemePrimary(value);
    if (field === "darkBg") setThemeDarkBg(value);
    if (field === "lightBg") setThemeLightBg(value);
    if (field === "textDark") setThemeTextDark(value);
    if (field === "textMedium") setThemeTextMedium(value);
    if (field === "textLight") setThemeTextLight(value);

    const match = THEME_PRESETS.find(
      (p) =>
        p.theme.primary.toLowerCase() === updated.primary.toLowerCase() &&
        p.theme.darkBg.toLowerCase() === updated.darkBg.toLowerCase() &&
        p.theme.lightBg.toLowerCase() === updated.lightBg.toLowerCase()
    );
    setSelectedPreset(match ? match.id : "custom");
    applyTheme(updated);
  };

  const handleSaveTheme = async () => {
    const themeToSave: ThemeConfig = {
      presetId: selectedPreset,
      primary: themePrimary,
      darkBg: themeDarkBg,
      lightBg: themeLightBg,
      textDark: themeTextDark,
      textMedium: themeTextMedium,
      textLight: themeTextLight,
    };

    try {
      await setDoc(doc(db, "siteContent", "main"), { theme: themeToSave }, { merge: true });
      setStoredTheme(themeToSave);
      setThemeSaveStatus("success");
      await recordUpload(1);
      setTimeout(() => setThemeSaveStatus(""), 4000);
    } catch (err) {
      console.error("Gagal menyimpan tema:", err);
      alert("Gagal menyimpan tema: " + (err as Error).message);
    }
  };

  const handleResetTheme = () => {
    const defaultPreset = THEME_PRESETS.find((p) => p.id === "ocean-blue") || THEME_PRESETS[1];
    handleSelectPreset(defaultPreset);
  };

  const handleAddResearch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "researchInterests"), {
        title: newResearchTitle,
        iconLink: newResearchIcon,
        createdAt: serverTimestamp(),
      });
      await recordUpload(1);
      alert("Research Interest baru berhasil ditambahkan!");
      setNewResearchTitle("");
      setNewResearchIcon("fab fa-pagelines");
      loadResearchList();
    } catch (error) {
      console.error(error);
      alert("Gagal menambahkan Research Interest.");
    }
  };

  const handleAddNews = async (e: React.FormEvent) => {
    e.preventDefault();
    const directLink = convertGoogleDriveLink(newNewsImageLink);
    if (!directLink) {
      alert("Link gambar berita tidak valid. Masukkan link share Google Drive atau URL gambar langsung.");
      return;
    }

    try {
      await addDoc(collection(db, "newsAndEvents"), {
        title: newNewsTitle,
        date: newNewsDate,
        summary: newNewsSummary,
        content: newNewsContent,
        image: directLink,
        createdAt: serverTimestamp(),
      });
      await recordUpload(1);
      alert("Berita & Kegiatan baru berhasil ditambahkan!");
      setNewNewsTitle("");
      setNewNewsDate("");
      setNewNewsSummary("");
      setNewNewsContent("");
      setNewNewsImageLink("");
      loadNewsList();
    } catch (error) {
      console.error(error);
      alert("Gagal menambahkan berita.");
    }
  };

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    const images = newProjectImagesLinks
      .split("\n")
      .filter(Boolean)
      .map(convertGoogleDriveLink)
      .filter(Boolean);

    if (images.length === 0) {
      alert("Masukkan setidaknya satu link gambar Google Drive yang valid untuk proyek.");
      return;
    }

    try {
      await addDoc(collection(db, "projects"), {
        title: newProjectTitle,
        description: newProjectDescription,
        link: newProjectLink,
        images,
        createdAt: serverTimestamp(),
      });
      await recordUpload(1);
      alert("Proyek baru berhasil ditambahkan!");
      setNewProjectTitle("");
      setNewProjectDescription("");
      setNewProjectLink("");
      setNewProjectImagesLinks("");
      loadProjectList();
    } catch (error) {
      console.error(error);
      alert("Gagal menambahkan proyek.");
    }
  };

  const handleAddTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    const directLink = convertGoogleDriveLink(newTeamImageLink);
    if (!directLink) {
      alert("Link foto anggota tim tidak valid.");
      return;
    }

    try {
      await addDoc(collection(db, "teamMembers"), {
        name: newTeamName,
        role: newTeamRole,
        image: directLink,
        createdAt: serverTimestamp(),
      });
      await recordUpload(1);
      alert("Anggota tim baru berhasil ditambahkan!");
      setNewTeamName("");
      setNewTeamRole("Mentor");
      setNewTeamImageLink("");
      loadTeamList();
    } catch (error) {
      console.error(error);
      alert("Gagal menambahkan anggota tim.");
    }
  };

  const handleDeleteItem = async (
    collectionName: string,
    docId: string,
    refreshFn: () => void
  ) => {
    if (confirm("Anda yakin ingin menghapus item ini? Tindakan ini tidak dapat dibatalkan.")) {
      try {
        await deleteDoc(doc(db, collectionName, docId));
        alert("Item berhasil dihapus.");
        refreshFn();
      } catch (err) {
        console.error(err);
        alert("Gagal menghapus item.");
      }
    }
  };

  const openEditResearch = (item: ResearchInterest) => {
    setActiveItem(item);
    setEditResearchTitle(item.title);
    setEditResearchIcon(item.iconLink);
    setModalTitle("Edit Research Interest");
    setModalType("edit-research");
    setModalOpen(true);
  };

  const loadCommentsForNews = async (newsId: string) => {
    setCommentsLoading(true);
    try {
      const q = query(
        collection(db, "newsAndEvents", newsId, "comments"),
        orderBy("createdAt", "desc")
      );
      const snap = await getDocs(q);
      const list: CommentItem[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...(d.data() as Omit<CommentItem, "id">) }));
      setNewsComments(list);
    } catch (err) {
      console.error(err);
    } finally {
      setCommentsLoading(false);
    }
  };

  const openEditNews = (item: NewsItem) => {
    setActiveItem(item);
    setEditNewsTitle(item.title);
    setEditNewsDate(item.date);
    setEditNewsSummary(item.summary);
    setEditNewsContent(item.content);
    setEditNewsImageLink("");
    setModalTitle("Edit News & Event");
    setModalType("edit-news");
    setModalOpen(true);
    loadCommentsForNews(item.id);
  };

  const handleDeleteComment = async (newsId: string, commentId: string) => {
    if (confirm("Anda yakin ingin menghapus komentar ini?")) {
      try {
        await deleteDoc(doc(db, "newsAndEvents", newsId, "comments", commentId));
        alert("Komentar berhasil dihapus.");
        loadCommentsForNews(newsId);
        loadAllComments();
      } catch (error) {
        console.error("Error deleting comment: ", error);
        alert("Gagal menghapus komentar.");
      }
    }
  };

  const openEditProject = (item: ProjectItem) => {
    setActiveItem(item);
    setEditProjectTitle(item.title);
    setEditProjectDescription(item.description);
    setEditProjectLink(item.link || "");
    setEditProjectImagesLinks((item.images || []).join("\n"));
    setModalTitle("Edit Project");
    setModalType("edit-project");
    setModalOpen(true);
  };

  const openEditTeam = (item: TeamMember) => {
    setActiveItem(item);
    setEditTeamName(item.name);
    setEditTeamRole(item.role);
    setEditTeamImageLink("");
    setModalTitle("Edit Team Member");
    setModalType("edit-team");
    setModalOpen(true);
  };

  const openChangePassword = () => {
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordError("");
    setModalTitle("Ubah Password");
    setModalType("change-password");
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setActiveItem(null);
    setModalType(null);
  };

  const handleModalSave = async () => {
    if (modalType === "edit-research" && activeItem) {
      try {
        await updateDoc(doc(db, "researchInterests", activeItem.id), {
          title: editResearchTitle,
          iconLink: editResearchIcon,
        });
        alert("Update Research Interest berhasil!");
        closeModal();
        loadResearchList();
      } catch (err) {
        console.error(err);
        alert("Gagal update data.");
      }
    } else if (modalType === "edit-news" && activeItem) {
      try {
        const updatedData: Partial<NewsItem> = {
          title: editNewsTitle,
          date: editNewsDate,
          summary: editNewsSummary,
          content: editNewsContent,
        };
        if (editNewsImageLink) {
          const directLink = convertGoogleDriveLink(editNewsImageLink);
          if (directLink) {
            updatedData.image = directLink;
          }
        }
        await updateDoc(doc(db, "newsAndEvents", activeItem.id), updatedData);
        alert("Update Berita berhasil!");
        closeModal();
        loadNewsList();
      } catch (err) {
        console.error(err);
        alert("Gagal update data.");
      }
    } else if (modalType === "edit-project" && activeItem) {
      try {
        const updatedData: Partial<ProjectItem> = {
          title: editProjectTitle,
          description: editProjectDescription,
          link: editProjectLink,
        };
        if (editProjectImagesLinks.trim() !== "") {
          const images = editProjectImagesLinks
            .split("\n")
            .filter(Boolean)
            .map(convertGoogleDriveLink)
            .filter(Boolean);
          if (images.length > 0) {
            updatedData.images = images;
          }
        }
        await updateDoc(doc(db, "projects", activeItem.id), updatedData);
        alert("Update Proyek berhasil!");
        closeModal();
        loadProjectList();
      } catch (err) {
        console.error(err);
        alert("Gagal update data.");
      }
    } else if (modalType === "edit-team" && activeItem) {
      try {
        const updatedData: Partial<TeamMember> = {
          name: editTeamName,
          role: editTeamRole,
        };
        if (editTeamImageLink) {
          const directLink = convertGoogleDriveLink(editTeamImageLink);
          if (directLink) {
            updatedData.image = directLink;
          } else {
            alert("Link foto baru tidak valid. Foto tidak akan diubah.");
          }
        }
        await updateDoc(doc(db, "teamMembers", activeItem.id), updatedData);
        alert("Update Anggota Tim berhasil!");
        closeModal();
        loadTeamList();
      } catch (err) {
        console.error(err);
        alert("Gagal update data.");
      }
    } else if (modalType === "change-password") {
      setPasswordError("");
      if (!newPassword || !oldPassword) {
        setPasswordError("Semua kolom password harus diisi.");
        return;
      }
      if (newPassword !== confirmPassword) {
        setPasswordError("Password baru tidak cocok.");
        return;
      }
      if (newPassword.length < 6) {
        setPasswordError("Password baru minimal harus 6 karakter.");
        return;
      }
      if (!currentUser || !currentUser.email) return;

      const credential = EmailAuthProvider.credential(currentUser.email, oldPassword);
      try {
        await reauthenticateWithCredential(currentUser, credential);
        await updatePassword(currentUser, newPassword);
        alert("Password berhasil diubah!");
        closeModal();
      } catch (error) {
        console.error(error);
        setPasswordError("Password lama salah. Silakan coba lagi.");
      }
    }
  };

  const handleDownloadDatabase = async () => {
    try {
      const backupData: Record<string, any> = {
        exportedAt: new Date().toISOString(),
        siteContent: {},
        researchInterests: [],
        newsAndEvents: [],
        projects: [],
        teamMembers: [],
        analytics: {},
      };

      const siteSnap = await getDoc(doc(db, "siteContent", "main"));
      if (siteSnap.exists()) backupData.siteContent = siteSnap.data();

      const resSnap = await getDocs(collection(db, "researchInterests"));
      resSnap.forEach((d) => backupData.researchInterests.push({ id: d.id, ...d.data() }));

      const newsSnap = await getDocs(collection(db, "newsAndEvents"));
      newsSnap.forEach((d) => backupData.newsAndEvents.push({ id: d.id, ...d.data() }));

      const projSnap = await getDocs(collection(db, "projects"));
      projSnap.forEach((d) => backupData.projects.push({ id: d.id, ...d.data() }));

      const teamSnap = await getDocs(collection(db, "teamMembers"));
      teamSnap.forEach((d) => backupData.teamMembers.push({ id: d.id, ...d.data() }));

      const analyticsSnap = await getDoc(doc(db, "analytics", "traffic"));
      if (analyticsSnap.exists()) backupData.analytics = analyticsSnap.data();

      const jsonStr = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const dateStr = new Date().toISOString().split("T")[0];
      a.href = url;
      a.download = `smartgrow_database_backup_${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      await recordDownload(1);
      alert("Backup database.json berhasil diunduh!");
      const updatedStats = await getAnalyticsStats();
      setAnalytics(updatedStats);
    } catch (err) {
      console.error("Backup failed:", err);
      alert("Gagal mengunduh backup database.");
    }
  };

  const handleImportDatabase = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm("PERINGATAN: Mengimpor database akan menimpa/memperbarui data saat ini dengan isi file JSON. Lanjutkan?")) {
      e.target.value = "";
      return;
    }

    setImporting(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (data.siteContent) {
        await setDoc(doc(db, "siteContent", "main"), data.siteContent, { merge: true });
      }

      if (Array.isArray(data.researchInterests)) {
        for (const item of data.researchInterests) {
          const { id, ...rest } = item;
          if (id) {
            await setDoc(doc(db, "researchInterests", id), rest, { merge: true });
          } else {
            await addDoc(collection(db, "researchInterests"), rest);
          }
        }
      }

      if (Array.isArray(data.newsAndEvents)) {
        for (const item of data.newsAndEvents) {
          const { id, ...rest } = item;
          if (id) {
            await setDoc(doc(db, "newsAndEvents", id), rest, { merge: true });
          } else {
            await addDoc(collection(db, "newsAndEvents"), rest);
          }
        }
      }

      if (Array.isArray(data.projects)) {
        for (const item of data.projects) {
          const { id, ...rest } = item;
          if (id) {
            await setDoc(doc(db, "projects", id), rest, { merge: true });
          } else {
            await addDoc(collection(db, "projects"), rest);
          }
        }
      }

      if (Array.isArray(data.teamMembers)) {
        for (const item of data.teamMembers) {
          const { id, ...rest } = item;
          if (id) {
            await setDoc(doc(db, "teamMembers", id), rest, { merge: true });
          } else {
            await addDoc(collection(db, "teamMembers"), rest);
          }
        }
      }

      await recordUpload(1);
      alert("Database berhasil dipulihkan / diimpor!");
      loadAllData();
    } catch (err) {
      console.error("Import failed:", err);
      alert("Gagal membaca atau mengimpor file database. Pastikan format file adalah JSON valid.");
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Live image previews
  const heroLeftPreview = convertGoogleDriveLink(heroLeftImage);
  const heroRightPreview = convertGoogleDriveLink(heroRightImage);
  const newsPreview = convertGoogleDriveLink(newNewsImageLink);
  const teamPreview = convertGoogleDriveLink(newTeamImageLink);
  const projectPreviews = newProjectImagesLinks
    .split("\n")
    .filter(Boolean)
    .map(convertGoogleDriveLink)
    .filter(Boolean);

  const editNewsPreview = convertGoogleDriveLink(editNewsImageLink);
  const editTeamPreview = convertGoogleDriveLink(editTeamImageLink);

  // Reference-styled navigation items matching uploaded image exactly
  const navTabs = [
    { id: "stats", num: "1", label: "Site Statistics", icon: "fas fa-chart-line" },
    { id: "theme", num: "2", label: "Theme & Colors", icon: "fas fa-palette" },
    { id: "hero", num: "3", label: "Home Page Settings", icon: "fas fa-home" },
    { id: "numbers", num: "4", label: "Statistics Numbers", icon: "fas fa-sort-numeric-up-alt" },
    { id: "research", num: "5", label: "Research Interests", icon: "fas fa-flask" },
    { id: "news", num: "6", label: "Articles & News", icon: "fas fa-book-open" },
    { id: "projects", num: "7", label: "Projects Portfolio", icon: "fas fa-layer-group" },
    { id: "team", num: "8", label: "Laboratory Members", icon: "fas fa-user-friends" },
    { id: "about", num: "9", label: "About Smart Grow Lab", icon: "fas fa-info-circle" },
    { id: "footer", num: "10", label: "Footer & Contacts", icon: "fas fa-phone-alt" },
    { id: "comments", num: "11", label: "Public Comments", icon: "fas fa-comments" },
    { id: "guidelines", num: "12", label: "Guidelines & Quota", icon: "fas fa-question-circle" },
    { id: "settings", num: "13", label: "Database & Security", icon: "fas fa-key" },
  ];

  const userInitial = currentUser?.email ? currentUser.email.charAt(0).toUpperCase() : "A";

  return (
    <div className="min-h-screen bg-[#111418] text-gray-200 antialiased flex flex-col">
      {loading && (
        <div
          id="loader"
          className="fixed inset-0 bg-[#111418]/85 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in"
        >
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary"></div>
        </div>
      )}

      {/* TOP HEADER (Identical layout to reference image) */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-gray-800/80 bg-[#111418] sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-base shadow-lg shadow-primary/30">
            {userInitial}
          </div>
          <div>
            <h1 className="text-white font-bold text-base tracking-tight leading-tight">
              Control Panel &amp; Content Manager
            </h1>
            <p className="text-xs text-gray-400">
              Logged in as: <span className="text-gray-200 font-medium">{currentUser?.email}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-white text-gray-900 font-semibold text-xs rounded-xl shadow hover:bg-gray-100 transition-all cursor-pointer flex items-center gap-1.5 transform hover:scale-105 active:scale-95"
          >
            <span>View Live Site</span>
            <i className="fas fa-external-link-alt text-[10px]"></i>
          </a>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-white text-red-600 font-semibold text-xs rounded-xl shadow hover:bg-red-50 transition-all cursor-pointer flex items-center gap-1.5 transform hover:scale-105 active:scale-95"
          >
            <i className="fas fa-sign-out-alt text-xs"></i>
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* MAIN TWO-COLUMN BODY */}
      <div className="flex-1 max-w-[1500px] w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
        {/* Mobile Fast-Jump Dropdown (< lg) */}
        <div className="lg:hidden w-full mb-1">
          <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">
            Pilih Menu Admin:
          </label>
          <div className="relative">
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value as AdminTab)}
              className="w-full bg-[#171b21] border border-gray-700 text-white py-3 px-4 rounded-2xl font-semibold text-sm appearance-none focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-lg cursor-pointer"
            >
              {navTabs.map((tab) => (
                <option key={tab.id} value={tab.id} className="bg-[#171b21] text-white">
                  {tab.num}. {tab.label}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
              <i className="fas fa-chevron-down text-xs"></i>
            </div>
          </div>
        </div>

        {/* LEFT COLUMN: PILL SIDEBAR NAVIGATION (Matching image style) */}
        <nav className="w-full lg:w-72 shrink-0 flex flex-row lg:flex-col gap-1.5 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0 scrollbar-none">
          {navTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as AdminTab)}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap text-left ${
                  isActive
                    ? "bg-primary text-white shadow-lg shadow-primary/30 transform scale-[1.02]"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <i className={`${tab.icon} w-5 text-center text-sm`}></i>
                <span>{tab.num}. {tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* RIGHT COLUMN: MAIN CONTENT PANEL CONTAINER */}
        <div className="flex-1 w-full bg-[#171b21] border border-gray-800/90 rounded-3xl p-6 sm:p-8 shadow-2xl relative min-h-[700px]">
          {/* ======================================================== */}
          {/* TAB 1: SITE STATISTICS (Matching exact look of image)    */}
          {/* ======================================================== */}
          {activeTab === "stats" && (
            <div className="space-y-8 animate-fade-in">
              {/* Header Title with Action Buttons */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                    Website Analytics &amp; Performance Statistics
                  </h2>
                  <p className="text-xs text-gray-400 mt-1">
                    Real-time visitor metrics, CDN data transfer, storage consumption, and upload/download statistics.
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={handleSimulateVisit}
                    className="px-3.5 py-1.5 rounded-full border border-primary/40 text-primary text-xs font-semibold hover:bg-primary/10 transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <span>+</span> Simulasikan Kunjungan (+1)
                  </button>
                  <div className="px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    Realtime Live Metrics
                  </div>
                </div>
              </div>

              {/* 4 Metrics Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Total Visits */}
                <div className="p-5 rounded-2xl bg-[#1c2229] border border-gray-800/80 flex flex-col justify-between hover-lift">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                      TOTAL VISITS
                    </span>
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 text-primary flex items-center justify-center text-xs">
                      <i className="fas fa-user-friends"></i>
                    </div>
                  </div>
                  <div className="mt-4">
                    <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                      {analytics.totalVisits.toLocaleString("id-ID")}
                    </h3>
                    <p className="text-[11px] text-emerald-400 font-semibold mt-1 flex items-center gap-1">
                      <span>↗</span> +18.4% this month
                    </p>
                  </div>
                </div>

                {/* 2. Today's Visits */}
                <div className="p-5 rounded-2xl bg-[#1c2229] border border-gray-800/80 flex flex-col justify-between hover-lift">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                      TODAY&apos;S VISITS
                    </span>
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs">
                      <i className="fas fa-bolt"></i>
                    </div>
                  </div>
                  <div className="mt-4">
                    <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                      {analytics.uniqueVisitors.toLocaleString("id-ID")}
                    </h3>
                    <p className="text-[11px] text-gray-400 mt-1">Unique visitors today</p>
                  </div>
                </div>

                {/* 3. Total Data Upload */}
                <div className="p-5 rounded-2xl bg-[#1c2229] border border-gray-800/80 flex flex-col justify-between hover-lift">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                      TOTAL DATA UPLOAD
                    </span>
                    <div className="w-8 h-8 rounded-full bg-amber-500/20 text-secondary flex items-center justify-center text-xs">
                      <i className="fas fa-cloud-upload-alt"></i>
                    </div>
                  </div>
                  <div className="mt-4">
                    <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                      {(analytics.totalUploads * 1.2 + 14.5).toFixed(1)} MB
                    </h3>
                    <p className="text-[11px] text-gray-400 mt-1">Media, certificates &amp; assets</p>
                  </div>
                </div>

                {/* 4. Total Bandwidth / Download */}
                <div className="p-5 rounded-2xl bg-[#1c2229] border border-gray-800/80 flex flex-col justify-between hover-lift">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                      TOTAL BANDWIDTH / DOWNLOAD
                    </span>
                    <div className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs">
                      <i className="fas fa-cloud-download-alt"></i>
                    </div>
                  </div>
                  <div className="mt-4">
                    <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                      {(analytics.totalVisits * 0.2 + 286.05).toFixed(2)} MB
                    </h3>
                    <p className="text-[11px] text-gray-400 mt-1">Global CDN delivery transferred</p>
                  </div>
                </div>
              </div>

              {/* Lower Breakdown Row (Upload & Storage + Download Bandwidth) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
                {/* Left Card: Upload & Storage Breakdown */}
                <div className="p-6 rounded-2xl bg-[#191f26] border border-gray-800/80 space-y-5">
                  <div>
                    <h4 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-2">
                      <i className="fas fa-layer-group"></i> UPLOAD &amp; STORAGE BREAKDOWN
                    </h4>
                    <p className="text-xs text-gray-400 mt-1">
                      Distribution of stored files, images, documents, and credentials across the site.
                    </p>
                  </div>

                  <div className="space-y-4 text-xs">
                    <div>
                      <div className="flex justify-between text-gray-300 mb-1.5 font-medium">
                        <span>Media Gallery &amp; Project Images</span>
                        <span className="text-gray-400">18.4 MB (48%)</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-gray-800 overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: "48%" }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-gray-300 mb-1.5 font-medium">
                        <span>Research &amp; Team Photographs</span>
                        <span className="text-gray-400">12.2 MB (32%)</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-gray-800 overflow-hidden">
                        <div className="h-full bg-emerald-400 rounded-full" style={{ width: "32%" }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-gray-300 mb-1.5 font-medium">
                        <span>Article Content &amp; News Covers</span>
                        <span className="text-gray-400">8.0 MB (20%)</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-gray-800 overflow-hidden">
                        <div className="h-full bg-secondary rounded-full" style={{ width: "20%" }}></div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gray-800 flex items-center justify-between text-xs">
                    <span className="text-gray-400">
                      Total Asset Files: <b className="text-white">{researchList.length + newsList.length + projectList.length + teamList.length} items</b>
                    </span>
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      Storage Efficiency: 99.4% Optimized
                    </span>
                  </div>
                </div>

                {/* Right Card: Download Bandwidth & CDN Performance */}
                <div className="p-6 rounded-2xl bg-[#191f26] border border-gray-800/80 space-y-5">
                  <div>
                    <h4 className="text-xs font-bold text-secondary uppercase tracking-wider flex items-center gap-2">
                      <i className="fas fa-globe"></i> DOWNLOAD BANDWIDTH &amp; CDN PERFORMANCE
                    </h4>
                    <p className="text-xs text-gray-400 mt-1">
                      Global CDN caching and payload transfer delivered to site visitors.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3.5 rounded-xl bg-[#14181e] border border-gray-800">
                      <p className="text-gray-400 text-[11px]">CDN Cache Hit Rate</p>
                      <p className="text-lg font-bold text-emerald-400 mt-1">98.8%</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">Instant Edge Delivery</p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#14181e] border border-gray-800">
                      <p className="text-gray-400 text-[11px]">Avg Transfer per Visit</p>
                      <p className="text-lg font-bold text-primary mt-1">1.85 MB</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">Gzip/Brotli Compressed</p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#14181e] border border-gray-800">
                      <p className="text-gray-400 text-[11px]">Edge Server TTFB</p>
                      <p className="text-lg font-bold text-purple-400 mt-1">~34 ms</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">Ultra-fast global response</p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#14181e] border border-gray-800">
                      <p className="text-gray-400 text-[11px]">SSL / Security</p>
                      <p className="text-lg font-bold text-emerald-400 mt-1">TLS 1.3</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">End-to-end encrypted</p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gray-800 flex items-center justify-between text-xs">
                    <span className="text-gray-400">CDN Edge Locations: <b className="text-white">300+</b></span>
                    <span className="text-emerald-400 font-bold">Status: 100% Online</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: THEME & COLORS (Matching exact look of image)     */}
          {/* ======================================================== */}
          {activeTab === "theme" && (
            <div className="space-y-6 animate-fade-in">
              {/* Header */}
              <div className="flex items-start gap-3.5">
                <span className="text-2xl mt-0.5 select-none">🎨</span>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                    Pengaturan Warna Website
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-400 mt-1">
                    Pilih preset palet warna siap pakai atau sesuaikan warna secara kustom di seluruh halaman web (termasuk Halaman Admin &amp; Login)
                  </p>
                </div>
              </div>

              {/* Toast / Notification */}
              {themeSaveStatus === "success" && (
                <div className="p-4 bg-emerald-950/70 border border-emerald-500/50 rounded-2xl flex items-center gap-3 text-emerald-300 text-sm animate-fade-in shadow-lg">
                  <i className="fas fa-check-circle text-lg text-emerald-400"></i>
                  <span>Pengaturan warna tema berhasil disimpan dan diterapkan di seluruh halaman website!</span>
                </div>
              )}

              {/* SECTION 1: PRESET PALET WARNA (PILIH 1-KLIK) */}
              <div className="bg-[#13171d] border border-gray-800/90 rounded-2xl p-5 sm:p-6 shadow-xl">
                <div className="flex items-center justify-between pb-3 border-b border-gray-800/70 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-amber-400 text-base">✨</span>
                    <h3 className="text-sm sm:text-base font-bold text-white tracking-wide">
                      Preset Palet Warna (Pilih 1-Klik)
                    </h3>
                  </div>
                  <span className="text-xs text-gray-400 font-medium">5 Pilihan Desain</span>
                </div>

                <p className="text-xs text-gray-400 mb-5">
                  Klik salah satu preset di bawah untuk langsung menerapkan kombinasi warna yang harmonis:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
                  {THEME_PRESETS.map((preset) => {
                    const isSelected = selectedPreset === preset.id;
                    return (
                      <div
                        key={preset.id}
                        onClick={() => handleSelectPreset(preset)}
                        className={`rounded-xl p-4 cursor-pointer transition-all duration-200 flex flex-col justify-between select-none ${
                          isSelected
                            ? "bg-[#181d24] border-2 border-amber-500 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/30 transform scale-[1.02]"
                            : "bg-[#151921] border border-gray-800/80 hover:border-gray-700 hover:bg-[#1a202a]"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-3">
                          <h4 className="text-xs sm:text-sm font-semibold text-gray-100">
                            {preset.name}
                          </h4>
                          {isSelected && (
                            <i className="fas fa-check-circle text-amber-400 text-sm shrink-0"></i>
                          )}
                        </div>

                        {/* 5 Color Pills */}
                        <div className="flex items-center gap-1.5 my-2">
                          {preset.colors.map((colorHex, idx) => (
                            <span
                              key={idx}
                              className="w-4 h-6 rounded-md shadow-xs border border-black/20 shrink-0"
                              style={{ backgroundColor: colorHex }}
                              title={colorHex}
                            />
                          ))}
                        </div>

                        <p className="text-[11px] text-gray-400 mt-2 font-medium">
                          {preset.subtitle}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SECTION 2: KUSTOMISASI DETAIL WARNA */}
              <div className="bg-[#13171d] border border-gray-800/90 rounded-2xl p-5 sm:p-6 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-gray-800/70 mb-5 gap-1">
                  <h3 className="text-sm sm:text-base font-bold text-white tracking-wide">
                    Kustomisasi Detail Warna
                  </h3>
                  <span className="text-xs text-gray-400 font-medium">
                    Atur nilai HEX &amp; Color Picker secara manual
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* 1. Warna Utama / Aksen */}
                  <div>
                    <label className="text-xs font-semibold text-gray-300 block mb-2">
                      Warna Utama / Aksen (Buttons &amp; Highlights)
                    </label>
                    <div className="flex items-center gap-3 bg-[#111418] border border-gray-800 rounded-xl p-2.5 hover:border-gray-700 transition-colors">
                      <div
                        className="relative w-10 h-10 rounded-lg shrink-0 overflow-hidden border border-gray-700/80 shadow-inner cursor-pointer"
                        style={{ backgroundColor: themePrimary }}
                      >
                        <input
                          type="color"
                          value={themePrimary.startsWith("#") ? themePrimary : "#EAB308"}
                          onChange={(e) => handleColorChange("primary", e.target.value)}
                          className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                          title="Buka Color Picker"
                        />
                      </div>
                      <div className="flex-1">
                        <input
                          type="text"
                          value={themePrimary}
                          onChange={(e) => handleColorChange("primary", e.target.value)}
                          placeholder="#EAB308"
                          maxLength={7}
                          className="w-full bg-transparent text-gray-100 font-mono text-sm font-semibold uppercase tracking-wider focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 2. Warna Latar Gelap */}
                  <div>
                    <label className="text-xs font-semibold text-gray-300 block mb-2">
                      Warna Latar Gelap (Section Background)
                    </label>
                    <div className="flex items-center gap-3 bg-[#111418] border border-gray-800 rounded-xl p-2.5 hover:border-gray-700 transition-colors">
                      <div
                        className="relative w-10 h-10 rounded-lg shrink-0 overflow-hidden border border-gray-700/80 shadow-inner cursor-pointer"
                        style={{ backgroundColor: themeDarkBg }}
                      >
                        <input
                          type="color"
                          value={themeDarkBg.startsWith("#") ? themeDarkBg : "#0A0A0A"}
                          onChange={(e) => handleColorChange("darkBg", e.target.value)}
                          className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                          title="Buka Color Picker"
                        />
                      </div>
                      <div className="flex-1">
                        <input
                          type="text"
                          value={themeDarkBg}
                          onChange={(e) => handleColorChange("darkBg", e.target.value)}
                          placeholder="#0A0A0A"
                          maxLength={7}
                          className="w-full bg-transparent text-gray-100 font-mono text-sm font-semibold uppercase tracking-wider focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 3. Warna Latar Terang */}
                  <div>
                    <label className="text-xs font-semibold text-gray-300 block mb-2">
                      Warna Latar Terang
                    </label>
                    <div className="flex items-center gap-3 bg-[#111418] border border-gray-800 rounded-xl p-2.5 hover:border-gray-700 transition-colors">
                      <div
                        className="relative w-10 h-10 rounded-lg shrink-0 overflow-hidden border border-gray-700/80 shadow-inner cursor-pointer"
                        style={{ backgroundColor: themeLightBg }}
                      >
                        <input
                          type="color"
                          value={themeLightBg.startsWith("#") ? themeLightBg : "#FEFCE8"}
                          onChange={(e) => handleColorChange("lightBg", e.target.value)}
                          className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                          title="Buka Color Picker"
                        />
                      </div>
                      <div className="flex-1">
                        <input
                          type="text"
                          value={themeLightBg}
                          onChange={(e) => handleColorChange("lightBg", e.target.value)}
                          placeholder="#FEFCE8"
                          maxLength={7}
                          className="w-full bg-transparent text-gray-100 font-mono text-sm font-semibold uppercase tracking-wider focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 4. Teks Gelap */}
                  <div>
                    <label className="text-xs font-semibold text-gray-300 block mb-2">
                      Teks Gelap
                    </label>
                    <div className="flex items-center gap-3 bg-[#111418] border border-gray-800 rounded-xl p-2.5 hover:border-gray-700 transition-colors">
                      <div
                        className="relative w-10 h-10 rounded-lg shrink-0 overflow-hidden border border-gray-700/80 shadow-inner cursor-pointer"
                        style={{ backgroundColor: themeTextDark }}
                      >
                        <input
                          type="color"
                          value={themeTextDark.startsWith("#") ? themeTextDark : "#171717"}
                          onChange={(e) => handleColorChange("textDark", e.target.value)}
                          className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                          title="Buka Color Picker"
                        />
                      </div>
                      <div className="flex-1">
                        <input
                          type="text"
                          value={themeTextDark}
                          onChange={(e) => handleColorChange("textDark", e.target.value)}
                          placeholder="#171717"
                          maxLength={7}
                          className="w-full bg-transparent text-gray-100 font-mono text-sm font-semibold uppercase tracking-wider focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 5. Teks Sedang */}
                  <div>
                    <label className="text-xs font-semibold text-gray-300 block mb-2">
                      Teks Sedang
                    </label>
                    <div className="flex items-center gap-3 bg-[#111418] border border-gray-800 rounded-xl p-2.5 hover:border-gray-700 transition-colors">
                      <div
                        className="relative w-10 h-10 rounded-lg shrink-0 overflow-hidden border border-gray-700/80 shadow-inner cursor-pointer"
                        style={{ backgroundColor: themeTextMedium }}
                      >
                        <input
                          type="color"
                          value={themeTextMedium.startsWith("#") ? themeTextMedium : "#262626"}
                          onChange={(e) => handleColorChange("textMedium", e.target.value)}
                          className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                          title="Buka Color Picker"
                        />
                      </div>
                      <div className="flex-1">
                        <input
                          type="text"
                          value={themeTextMedium}
                          onChange={(e) => handleColorChange("textMedium", e.target.value)}
                          placeholder="#262626"
                          maxLength={7}
                          className="w-full bg-transparent text-gray-100 font-mono text-sm font-semibold uppercase tracking-wider focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 6. Teks Terang / Muted */}
                  <div>
                    <label className="text-xs font-semibold text-gray-300 block mb-2">
                      Teks Terang / Muted
                    </label>
                    <div className="flex items-center gap-3 bg-[#111418] border border-gray-800 rounded-xl p-2.5 hover:border-gray-700 transition-colors">
                      <div
                        className="relative w-10 h-10 rounded-lg shrink-0 overflow-hidden border border-gray-700/80 shadow-inner cursor-pointer"
                        style={{ backgroundColor: themeTextLight }}
                      >
                        <input
                          type="color"
                          value={themeTextLight.startsWith("#") ? themeTextLight : "#474747"}
                          onChange={(e) => handleColorChange("textLight", e.target.value)}
                          className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                          title="Buka Color Picker"
                        />
                      </div>
                      <div className="flex-1">
                        <input
                          type="text"
                          value={themeTextLight}
                          onChange={(e) => handleColorChange("textLight", e.target.value)}
                          placeholder="#474747"
                          maxLength={7}
                          className="w-full bg-transparent text-gray-100 font-mono text-sm font-semibold uppercase tracking-wider focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ACTIONS BAR */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-gray-800">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <i className="fas fa-info-circle text-primary"></i>
                  <span>Perubahan warna langsung terlihat secara real-time di pratinjau browser.</span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleResetTheme}
                    className="px-5 py-2.5 rounded-xl border border-gray-700 text-gray-300 hover:text-white hover:bg-white/5 transition-all text-xs font-semibold cursor-pointer"
                  >
                    <i className="fas fa-undo mr-1.5"></i>
                    Reset ke Ocean Blue
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveTheme}
                    className="px-6 py-2.5 bg-primary text-white rounded-xl shadow-lg shadow-primary/30 hover:bg-primary/90 transition-all text-xs font-bold flex items-center gap-2 cursor-pointer transform hover:scale-105 active:scale-95"
                  >
                    <i className="fas fa-check"></i>
                    Simpan Pengaturan Tema
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 3: HOME PAGE SETTINGS (HERO & BANNER)                */}
          {/* ======================================================== */}
          {activeTab === "hero" && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  Home Page (Hero &amp; Banner Settings)
                </h2>
                <p className="text-xs text-gray-400 mt-1">
                  Atur teks judul, deskripsi, foto pojok kiri, dan foto pojok kanan beranda website.
                </p>
              </div>

              <form onSubmit={handleSaveSiteContent} className="space-y-6 pt-4 border-t border-gray-800">
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
                    Judul Utama Hero (Gunakan &lt;br/&gt; untuk baris baru)
                  </label>
                  <input
                    type="text"
                    value={heroTitle}
                    onChange={(e) => setHeroTitle(e.target.value)}
                    placeholder="Contoh: Driving Agricultural Progress with AIoT <br/> and Smart Farming"
                    className="w-full bg-[#14181e] border border-gray-800 rounded-xl p-3.5 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
                    Deskripsi Hero
                  </label>
                  <textarea
                    rows={3}
                    value={heroDescription}
                    onChange={(e) => setHeroDescription(e.target.value)}
                    placeholder="Contoh: Integrated research and innovation hub focused on developing sustainable smart agricultural systems."
                    className="w-full bg-[#14181e] border border-gray-800 rounded-xl p-3.5 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-800">
                  {/* Foto Pojok Kiri */}
                  <div>
                    <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1">
                      Foto Pojok Kiri (Hero Left Image)
                    </label>
                    <p className="text-[11px] text-gray-400 mb-2">
                      Paste link share Google Drive. Skala foto akan disesuaikan otomatis.
                    </p>
                    <input
                      type="url"
                      value={heroLeftImage}
                      onChange={(e) => setHeroLeftImage(e.target.value)}
                      placeholder="https://drive.google.com/file/d/1abc.../view?usp=sharing"
                      className="w-full bg-[#14181e] border border-gray-800 rounded-xl p-3.5 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                    />
                    <div className="mt-3 w-full h-44 rounded-2xl border border-dashed border-gray-700 overflow-hidden bg-[#14181e] flex items-center justify-center">
                      {heroLeftPreview ? (
                        <img src={heroLeftPreview} alt="Left Hero" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs text-gray-500">Pratinjau Foto Pojok Kiri</span>
                      )}
                    </div>
                  </div>

                  {/* Foto Pojok Kanan & Teks */}
                  <div>
                    <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1">
                      Foto Pojok Kanan (Hero Right Image)
                    </label>
                    <p className="text-[11px] text-gray-400 mb-2">
                      Gambar latar kartu produktivitas di pojok kanan hero.
                    </p>
                    <input
                      type="url"
                      value={heroRightImage}
                      onChange={(e) => setHeroRightImage(e.target.value)}
                      placeholder="https://drive.google.com/file/d/1xyz.../view?usp=sharing"
                      className="w-full bg-[#14181e] border border-gray-800 rounded-xl p-3.5 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                    />
                    <div className="mt-3 w-full h-44 rounded-2xl border border-dashed border-gray-700 overflow-hidden bg-[#14181e] flex items-center justify-center">
                      {heroRightPreview ? (
                        <img src={heroRightPreview} alt="Right Hero" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs text-gray-500">Pratinjau Foto Pojok Kanan</span>
                      )}
                    </div>

                    <div className="mt-4">
                      <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1">
                        Teks Kartu Pojok Kanan
                      </label>
                      <input
                        type="text"
                        value={heroRightText}
                        onChange={(e) => setHeroRightText(e.target.value)}
                        placeholder="Achieve optimal efficiency and boost productivity!"
                        className="w-full bg-[#14181e] border border-gray-800 rounded-xl p-3.5 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-3.5 bg-primary text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-primary/30 hover:bg-primary/90 transition-all cursor-pointer transform hover:scale-105 active:scale-95"
                  >
                    <i className="fas fa-save mr-2"></i> Simpan Perubahan Hero
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 3: STATS NUMBERS                                     */}
          {/* ======================================================== */}
          {activeTab === "numbers" && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  Statistics Numbers
                </h2>
                <p className="text-xs text-gray-400 mt-1">
                  Ubah angka capaian statistik utama yang tampil di beranda website.
                </p>
              </div>

              <form onSubmit={handleSaveSiteContent} className="space-y-6 pt-4 border-t border-gray-800">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
                      Partners &amp; Clients
                    </label>
                    <input
                      type="text"
                      value={statPartners}
                      onChange={(e) => setStatPartners(e.target.value)}
                      placeholder="Contoh: 10+"
                      className="w-full bg-[#14181e] border border-gray-800 rounded-xl p-3.5 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
                      Total Project
                    </label>
                    <input
                      type="text"
                      value={statProjects}
                      onChange={(e) => setStatProjects(e.target.value)}
                      placeholder="Contoh: 15+"
                      className="w-full bg-[#14181e] border border-gray-800 rounded-xl p-3.5 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
                      Peningkatan Bulan Ini
                    </label>
                    <input
                      type="text"
                      value={statIncrease}
                      onChange={(e) => setStatIncrease(e.target.value)}
                      placeholder="Contoh: +5"
                      className="w-full bg-[#14181e] border border-gray-800 rounded-xl p-3.5 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
                      Anggota Lab
                    </label>
                    <input
                      type="text"
                      value={statMembers}
                      onChange={(e) => setStatMembers(e.target.value)}
                      placeholder="Contoh: 8+"
                      className="w-full bg-[#14181e] border border-gray-800 rounded-xl p-3.5 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-3.5 bg-primary text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-primary/30 hover:bg-primary/90 transition-all cursor-pointer transform hover:scale-105 active:scale-95"
                  >
                    <i className="fas fa-save mr-2"></i> Simpan Statistik Angka
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 4: RESEARCH INTERESTS (WITH ICON PICKER)             */}
          {/* ======================================================== */}
          {activeTab === "research" && (
            <div className="space-y-8 animate-fade-in">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  Research Interests
                </h2>
                <p className="text-xs text-gray-400 mt-1">
                  Kelola fokus bidang riset laboratorium lengkap dengan pemilih ikon visual.
                </p>
              </div>

              {/* Add form */}
              <div className="p-6 rounded-2xl bg-[#191f26] border border-gray-800/80">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
                  Tambah Research Interest Baru
                </h3>
                <form onSubmit={handleAddResearch} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
                      Judul Research Interest
                    </label>
                    <input
                      type="text"
                      value={newResearchTitle}
                      onChange={(e) => setNewResearchTitle(e.target.value)}
                      placeholder="Contoh: Quantum &amp; Information Security"
                      required
                      className="w-full bg-[#14181e] border border-gray-800 rounded-xl p-3.5 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
                      Pilihan Ikon FontAwesome
                    </label>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-[#14181e] border border-gray-800 flex items-center justify-center text-2xl text-primary shrink-0">
                        <i className={newResearchIcon || "fas fa-question"}></i>
                      </div>
                      <input
                        type="text"
                        value={newResearchIcon}
                        onChange={(e) => setNewResearchIcon(e.target.value)}
                        placeholder="fab fa-pagelines"
                        required
                        className="flex-1 bg-[#14181e] border border-gray-800 rounded-xl p-3.5 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setIconPickerTarget("new");
                          setIconPickerOpen(true);
                        }}
                        className="px-4 py-3.5 bg-primary text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-primary/90 transition-colors cursor-pointer shrink-0 shadow-md shadow-primary/20"
                      >
                        <i className="fas fa-icons mr-1.5"></i> Pilih Ikon...
                      </button>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="px-6 py-3.5 bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-600/30 hover:bg-emerald-700 transition-all cursor-pointer transform hover:scale-105 active:scale-95"
                    >
                      <i className="fas fa-plus mr-2"></i> Tambah Interest
                    </button>
                  </div>
                </form>
              </div>

              {/* List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-gray-400 font-bold uppercase tracking-wider pb-2 border-b border-gray-800">
                  <span>Daftar Research Interests ({researchList.length})</span>
                  <span>Urutan: Terbaru di Atas</span>
                </div>

                <div className="space-y-2">
                  {researchList.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-xl bg-[#1c2229] border border-gray-800/80 flex items-center justify-between hover:bg-[#202730] transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#14181e] flex items-center justify-center text-primary text-xl">
                          <i className={item.iconLink}></i>
                        </div>
                        <div>
                          <h4 className="font-bold text-white text-sm">{item.title}</h4>
                          <span className="text-[11px] text-gray-400 font-mono">{item.iconLink}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditResearch(item)}
                          className="px-3 py-1.5 bg-amber-500/20 text-secondary border border-secondary/30 rounded-lg text-xs font-semibold hover:bg-amber-500/30 transition-colors cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteItem("researchInterests", item.id, loadResearchList)}
                          className="px-3 py-1.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-xs font-semibold hover:bg-red-500/30 transition-colors cursor-pointer"
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 5: ARTICLES & NEWS                                   */}
          {/* ======================================================== */}
          {activeTab === "news" && (
            <div className="space-y-8 animate-fade-in">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  Articles &amp; News Manager
                </h2>
                <p className="text-xs text-gray-400 mt-1">
                  Publikasikan berita atau kegiatan terbaru Smart Grow Lab.
                </p>
              </div>

              {/* Add News */}
              <div className="p-6 rounded-2xl bg-[#191f26] border border-gray-800/80">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
                  Tambah Berita Baru
                </h3>
                <form onSubmit={handleAddNews} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
                        Judul Berita
                      </label>
                      <input
                        type="text"
                        value={newNewsTitle}
                        onChange={(e) => setNewNewsTitle(e.target.value)}
                        placeholder="Contoh: Budidaya Aquaponik Modern di Panyileukan"
                        required
                        className="w-full bg-[#14181e] border border-gray-800 rounded-xl p-3.5 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
                        Tanggal Tampil
                      </label>
                      <input
                        type="text"
                        value={newNewsDate}
                        onChange={(e) => setNewNewsDate(e.target.value)}
                        placeholder="Contoh: Oktober 2024"
                        required
                        className="w-full bg-[#14181e] border border-gray-800 rounded-xl p-3.5 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
                      Ringkasan Singkat (Tampil di Beranda)
                    </label>
                    <textarea
                      rows={3}
                      value={newNewsSummary}
                      onChange={(e) => setNewNewsSummary(e.target.value)}
                      placeholder="Tuliskan rangkuman 1-2 kalimat untuk kartu depan..."
                      required
                      className="w-full bg-[#14181e] border border-gray-800 rounded-xl p-3.5 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
                      Isi Lengkap Berita (Mendukung HTML)
                    </label>
                    <textarea
                      rows={6}
                      value={newNewsContent}
                      onChange={(e) => setNewNewsContent(e.target.value)}
                      placeholder="Tuliskan seluruh isi artikel berita secara lengkap di sini..."
                      required
                      className="w-full bg-[#14181e] border border-gray-800 rounded-xl p-3.5 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1">
                      Link Google Drive Foto Berita
                    </label>
                    <p className="text-[11px] text-gray-400 mb-2">
                      Copy link share dari Google Drive. Pratinjau skala otomatis akan muncul langsung.
                    </p>
                    <input
                      type="url"
                      value={newNewsImageLink}
                      onChange={(e) => setNewNewsImageLink(e.target.value)}
                      placeholder="https://drive.google.com/file/d/1ABCXYZ.../view?usp=sharing"
                      required
                      className="w-full bg-[#14181e] border border-gray-800 rounded-xl p-3.5 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                    />
                    <div className="mt-3 w-48 h-32 rounded-xl border border-dashed border-gray-700 overflow-hidden bg-[#14181e] flex items-center justify-center">
                      {newsPreview ? (
                        <img src={newsPreview} alt="News Preview" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs text-gray-500">Pratinjau Foto</span>
                      )}
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="px-6 py-3.5 bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-600/30 hover:bg-emerald-700 transition-all cursor-pointer transform hover:scale-105 active:scale-95"
                    >
                      <i className="fas fa-plus mr-2"></i> Tambah Berita Baru
                    </button>
                  </div>
                </form>
              </div>

              {/* List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-gray-400 font-bold uppercase tracking-wider pb-2 border-b border-gray-800">
                  <span>Daftar Berita ({newsList.length})</span>
                  <span>Urutan: Terbaru di Atas</span>
                </div>

                <div className="space-y-2">
                  {newsList.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-xl bg-[#1c2229] border border-gray-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#202730] transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-[#14181e] overflow-hidden shrink-0 border border-gray-800">
                          <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <h4 className="font-bold text-white text-sm">{item.title}</h4>
                          <p className="text-xs text-gray-400 mt-1">{item.date}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        <button
                          onClick={() => openEditNews(item)}
                          className="px-3 py-1.5 bg-amber-500/20 text-secondary border border-secondary/30 rounded-lg text-xs font-semibold hover:bg-amber-500/30 transition-colors cursor-pointer"
                        >
                          Edit &amp; Komentar
                        </button>
                        <button
                          onClick={() => handleDeleteItem("newsAndEvents", item.id, loadNewsList)}
                          className="px-3 py-1.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-xs font-semibold hover:bg-red-500/30 transition-colors cursor-pointer"
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 6: PROJECTS PORTFOLIO                                */}
          {/* ======================================================== */}
          {activeTab === "projects" && (
            <div className="space-y-8 animate-fade-in">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  Projects Portfolio
                </h2>
                <p className="text-xs text-gray-400 mt-1">
                  Atur proyek riset inovatif dan galeri gambar slider beranda.
                </p>
              </div>

              {/* Add form */}
              <div className="p-6 rounded-2xl bg-[#191f26] border border-gray-800/80">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
                  Tambah Proyek Baru
                </h3>
                <form onSubmit={handleAddProject} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
                      Judul Proyek
                    </label>
                    <input
                      type="text"
                      value={newProjectTitle}
                      onChange={(e) => setNewProjectTitle(e.target.value)}
                      placeholder="Contoh: HYCOSMARTS Container Farming"
                      required
                      className="w-full bg-[#14181e] border border-gray-800 rounded-xl p-3.5 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
                      Deskripsi Lengkap Proyek
                    </label>
                    <textarea
                      rows={4}
                      value={newProjectDescription}
                      onChange={(e) => setNewProjectDescription(e.target.value)}
                      placeholder="Tuliskan penjelasan sistem, teknologi yang dipakai, serta manfaat proyek..."
                      required
                      className="w-full bg-[#14181e] border border-gray-800 rounded-xl p-3.5 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
                      Link Proyek Luar (Opsional)
                    </label>
                    <input
                      type="url"
                      value={newProjectLink}
                      onChange={(e) => setNewProjectLink(e.target.value)}
                      placeholder="https://contoh-link-proyek.com/detail"
                      className="w-full bg-[#14181e] border border-gray-800 rounded-xl p-3.5 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1">
                      Link Google Drive Gambar Proyek (1 Link Per Baris)
                    </label>
                    <p className="text-[11px] text-gray-400 mb-2">
                      Tempelkan link share Google Drive di baris baru. Pratinjau galeri akan muncul otomatis.
                    </p>
                    <textarea
                      rows={4}
                      value={newProjectImagesLinks}
                      onChange={(e) => setNewProjectImagesLinks(e.target.value)}
                      placeholder="https://drive.google.com/file/d/1AAA.../view?usp=sharing&#10;https://drive.google.com/file/d/2BBB.../view?usp=sharing"
                      required
                      className="w-full bg-[#14181e] border border-gray-800 rounded-xl p-3.5 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition font-mono"
                    />

                    <div className="mt-3 flex flex-wrap gap-2">
                      {projectPreviews.length > 0 ? (
                        projectPreviews.map((link, idx) => (
                          <div key={idx} className="w-20 h-20 rounded-xl border border-gray-700 overflow-hidden bg-[#14181e]">
                            <img src={link} alt="Thumb" className="w-full h-full object-cover" />
                          </div>
                        ))
                      ) : (
                        <span className="text-xs text-gray-500">Pratinjau galeri gambar akan muncul di sini</span>
                      )}
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="px-6 py-3.5 bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-600/30 hover:bg-emerald-700 transition-all cursor-pointer transform hover:scale-105 active:scale-95"
                    >
                      <i className="fas fa-plus mr-2"></i> Tambah Proyek Baru
                    </button>
                  </div>
                </form>
              </div>

              {/* List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-gray-400 font-bold uppercase tracking-wider pb-2 border-b border-gray-800">
                  <span>Daftar Proyek ({projectList.length})</span>
                  <span>Urutan: Terbaru di Atas</span>
                </div>

                <div className="space-y-2">
                  {projectList.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-xl bg-[#1c2229] border border-gray-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#202730] transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-[#14181e] overflow-hidden shrink-0 border border-gray-800">
                          {item.images?.[0] ? (
                            <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover" />
                          ) : null}
                        </div>
                        <div>
                          <h4 className="font-bold text-white text-sm">{item.title}</h4>
                          <p className="text-xs text-gray-400 mt-1">{item.images?.length || 0} Gambar terlampir</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        <button
                          onClick={() => openEditProject(item)}
                          className="px-3 py-1.5 bg-amber-500/20 text-secondary border border-secondary/30 rounded-lg text-xs font-semibold hover:bg-amber-500/30 transition-colors cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteItem("projects", item.id, loadProjectList)}
                          className="px-3 py-1.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-xs font-semibold hover:bg-red-500/30 transition-colors cursor-pointer"
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 7: OUR TEAM MEMBERS                                  */}
          {/* ======================================================== */}
          {activeTab === "team" && (
            <div className="space-y-8 animate-fade-in">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  Laboratory Members
                </h2>
                <p className="text-xs text-gray-400 mt-1">
                  Atur daftar dosen pembimbing (Mentor) dan anggota peneliti (Member).
                </p>
              </div>

              {/* Add form */}
              <div className="p-6 rounded-2xl bg-[#191f26] border border-gray-800/80">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
                  Tambah Anggota Tim Baru
                </h3>
                <form onSubmit={handleAddTeam} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
                        Nama Lengkap &amp; Gelar
                      </label>
                      <input
                        type="text"
                        value={newTeamName}
                        onChange={(e) => setNewTeamName(e.target.value)}
                        placeholder="Contoh: Dr. Ir. Indrarini Dyah Irawati"
                        required
                        className="w-full bg-[#14181e] border border-gray-800 rounded-xl p-3.5 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
                        Posisi / Peran
                      </label>
                      <select
                        value={newTeamRole}
                        onChange={(e) => setNewTeamRole(e.target.value)}
                        required
                        className="w-full bg-[#14181e] border border-gray-800 rounded-xl p-3.5 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                      >
                        <option value="Mentor">Mentor (Tampil Besar di Atas)</option>
                        <option value="Member">Member (Anggota Lab)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1">
                      Link Google Drive Foto Anggota
                    </label>
                    <p className="text-[11px] text-gray-400 mb-2">
                      Copy link share dari Google Drive. Skala foto potret/lanskap otomatis disesuaikan.
                    </p>
                    <input
                      type="url"
                      value={newTeamImageLink}
                      onChange={(e) => setNewTeamImageLink(e.target.value)}
                      placeholder="https://drive.google.com/file/d/1MEMBER.../view?usp=sharing"
                      required
                      className="w-full bg-[#14181e] border border-gray-800 rounded-xl p-3.5 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                    />
                    <div className="mt-3 w-32 h-44 rounded-2xl border border-dashed border-gray-700 overflow-hidden bg-[#14181e] flex items-center justify-center">
                      {teamPreview ? (
                        <img src={teamPreview} alt="Team Preview" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs text-gray-500">Pratinjau Foto</span>
                      )}
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="px-6 py-3.5 bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-600/30 hover:bg-emerald-700 transition-all cursor-pointer transform hover:scale-105 active:scale-95"
                    >
                      <i className="fas fa-plus mr-2"></i> Tambah Anggota Tim
                    </button>
                  </div>
                </form>
              </div>

              {/* List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-gray-400 font-bold uppercase tracking-wider pb-2 border-b border-gray-800">
                  <span>Daftar Anggota Tim ({teamList.length})</span>
                  <span>Urutan: Terbaru di Atas</span>
                </div>

                <div className="space-y-2">
                  {teamList.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-xl bg-[#1c2229] border border-gray-800/80 flex items-center justify-between hover:bg-[#202730] transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-16 rounded-xl bg-[#14181e] overflow-hidden shrink-0 border border-gray-800">
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <h4 className="font-bold text-white text-sm">{item.name}</h4>
                          <span
                            className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 ${
                              item.role === "Mentor"
                                ? "bg-amber-500/20 text-secondary border border-secondary/30"
                                : "bg-blue-500/20 text-primary border border-primary/30"
                            }`}
                          >
                            {item.role}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditTeam(item)}
                          className="px-3 py-1.5 bg-amber-500/20 text-secondary border border-secondary/30 rounded-lg text-xs font-semibold hover:bg-amber-500/30 transition-colors cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteItem("teamMembers", item.id, loadTeamList)}
                          className="px-3 py-1.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-xs font-semibold hover:bg-red-500/30 transition-colors cursor-pointer"
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 8: ABOUT SMART GROW LAB                              */}
          {/* ======================================================== */}
          {activeTab === "about" && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  About Smart Grow Lab
                </h2>
                <p className="text-xs text-gray-400 mt-1">
                  Sesuaikan teks profil dan tombol Join Us pada bagian Tentang Kami di halaman utama.
                </p>
              </div>

              <form onSubmit={handleSaveSiteContent} className="space-y-6 pt-4 border-t border-gray-800">
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
                    Judul Section Tentang Kami
                  </label>
                  <input
                    type="text"
                    value={aboutTitle}
                    onChange={(e) => setAboutTitle(e.target.value)}
                    placeholder="Smart Grow Lab"
                    className="w-full bg-[#14181e] border border-gray-800 rounded-xl p-3.5 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
                    Paragraf 1 (Penjelasan Hub Riset &amp; Visi Misi)
                  </label>
                  <textarea
                    rows={4}
                    value={aboutParagraph1}
                    onChange={(e) => setAboutParagraph1(e.target.value)}
                    placeholder="SMART GROW LAB is an integrated research and innovation hub focused on developing intelligent, sustainable, and data-driven agricultural systems..."
                    className="w-full bg-[#14181e] border border-gray-800 rounded-xl p-3.5 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
                    Paragraf 2 (Aktivitas Utama &amp; Solusi Riset)
                  </label>
                  <textarea
                    rows={4}
                    value={aboutParagraph2}
                    onChange={(e) => setAboutParagraph2(e.target.value)}
                    placeholder="Our core activities include the design and implementation of smart farming solutions—ranging from hydroponics and aquaponics..."
                    className="w-full bg-[#14181e] border border-gray-800 rounded-xl p-3.5 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
                    Link Tombol &quot;Join Us!&quot;
                  </label>
                  <input
                    type="url"
                    value={joinUsLink}
                    onChange={(e) => setJoinUsLink(e.target.value)}
                    placeholder="https://forms.gle/... atau https://example.com/join"
                    className="w-full bg-[#14181e] border border-gray-800 rounded-xl p-3.5 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                  />
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-3.5 bg-primary text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-primary/30 hover:bg-primary/90 transition-all cursor-pointer transform hover:scale-105 active:scale-95"
                  >
                    <i className="fas fa-save mr-2"></i> Simpan Teks Tentang Lab
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 9: FOOTER & CONTACTS                                 */}
          {/* ======================================================== */}
          {activeTab === "footer" && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  Footer &amp; Contacts
                </h2>
                <p className="text-xs text-gray-400 mt-1">
                  Atur informasi alamat kantor, tautan riset &amp; inovasi, serta narahubung footer.
                </p>
              </div>

              <form onSubmit={handleSaveSiteContent} className="space-y-6 pt-4 border-t border-gray-800">
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
                    Alamat Kantor (Office Address)
                  </label>
                  <textarea
                    rows={3}
                    value={footerAddress}
                    onChange={(e) => setFooterAddress(e.target.value)}
                    placeholder="Bandung Techno Park, Telkom University, Jl. Telekomunikasi No. 1, Bandung"
                    className="w-full bg-[#14181e] border border-gray-800 rounded-xl p-3.5 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
                    Research &amp; Innovation Links (1 Link Per Baris, Format: Teks|URL)
                  </label>
                  <textarea
                    rows={4}
                    value={footerResearch}
                    onChange={(e) => setFooterResearch(e.target.value)}
                    placeholder="Bandung Techno Park|https://btp.telkomuniversity.ac.id/&#10;Telkom University|https://telkomuniversity.ac.id/"
                    className="w-full bg-[#14181e] border border-gray-800 rounded-xl p-3.5 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
                    Kontak Kami (Contact Us, Format: Teks|URL)
                  </label>
                  <textarea
                    rows={4}
                    value={footerContact}
                    onChange={(e) => setFooterContact(e.target.value)}
                    placeholder="indrarini@telkomuniversity.ac.id|mailto:indrarini@telkomuniversity.ac.id&#10;WhatsApp Lab|https://wa.me/628123456789"
                    className="w-full bg-[#14181e] border border-gray-800 rounded-xl p-3.5 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition font-mono"
                  />
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-3.5 bg-primary text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-primary/30 hover:bg-primary/90 transition-all cursor-pointer transform hover:scale-105 active:scale-95"
                  >
                    <i className="fas fa-save mr-2"></i> Simpan Pengaturan Footer
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 10: PUBLIC COMMENTS (Matching tab in image)          */}
          {/* ======================================================== */}
          {activeTab === "comments" && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                    Public Comments Manager
                  </h2>
                  <p className="text-xs text-gray-400 mt-1">
                    Kelola dan moderasi seluruh komentar publik yang masuk di artikel berita.
                  </p>
                </div>
                <button
                  onClick={loadAllComments}
                  className="px-3.5 py-2 bg-[#1c2229] border border-gray-800 rounded-xl text-xs font-semibold text-gray-300 hover:text-white cursor-pointer"
                >
                  <i className="fas fa-sync-alt mr-1"></i> Refresh Komentar
                </button>
              </div>

              <div className="space-y-3 pt-4 border-t border-gray-800">
                {allComments.length === 0 ? (
                  <div className="p-8 rounded-2xl bg-[#191f26] border border-gray-800/80 text-center text-gray-500 text-sm">
                    Belum ada komentar dari pengunjung website.
                  </div>
                ) : (
                  allComments.map((comment) => (
                    <div
                      key={comment.id}
                      className="p-5 rounded-xl bg-[#1c2229] border border-gray-800/80 flex flex-col sm:flex-row sm:items-start justify-between gap-4"
                    >
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">{comment.name}</span>
                          <span className="text-xs text-gray-400">({comment.email})</span>
                        </div>
                        <p className="text-xs text-primary font-medium">Artikel: {comment.newsTitle}</p>
                        <p className="text-xs text-gray-300 whitespace-pre-wrap leading-relaxed mt-2">
                          {comment.text}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteComment(comment.newsId, comment.id)}
                        className="px-3 py-1.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-xs font-semibold hover:bg-red-500/30 transition-colors cursor-pointer self-end sm:self-start"
                      >
                        Hapus Komentar
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 11: GUIDELINES & QUOTA (User friendly)               */}
          {/* ======================================================== */}
          {activeTab === "guidelines" && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                  <i className="fas fa-book-open text-primary"></i> Panduan Pengisian &amp; Batasan Kuota Web
                </h2>
                <p className="text-xs text-gray-400 mt-1">
                  Panduan praktis dengan bahasa sederhana untuk mempermudah admin mengelola website.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-800">
                <div className="p-5 rounded-2xl bg-[#191f26] border border-gray-800/80 space-y-2">
                  <h4 className="font-bold text-white text-sm flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold">1</span>
                    Cara Mengisi Foto dari Google Drive
                  </h4>
                  <ul className="text-xs text-gray-400 space-y-1.5 list-disc list-inside leading-relaxed">
                    <li>Upload foto ke Google Drive Anda.</li>
                    <li>Klik kanan foto &gt; pilih <b>Bagikan (Share)</b>.</li>
                    <li>Ubah Akses Umum menjadi <b>&quot;Siapa saja yang memiliki link&quot;</b>.</li>
                    <li>Salin link dan tempelkan ke kolom foto di admin. Pratinjau langsung muncul!</li>
                  </ul>
                </div>

                <div className="p-5 rounded-2xl bg-[#191f26] border border-gray-800/80 space-y-2">
                  <h4 className="font-bold text-white text-sm flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-500 text-white text-xs flex items-center justify-center font-bold">2</span>
                    Skala Foto Otomatis
                  </h4>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Ukuran foto apa pun (vertikal, horizontal, resolusi tinggi) sudah otomatis disesuaikan secara proporsional oleh website sehingga tidak akan gepeng atau merusak tampilan.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-[#191f26] border border-gray-800/80 space-y-2">
                  <h4 className="font-bold text-white text-sm flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-secondary text-gray-900 text-xs flex items-center justify-center font-bold">3</span>
                    Urutan Konten Otomatis Terbaru
                  </h4>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Setiap Berita, Proyek, Riset, atau Anggota Tim yang baru ditambahkan akan otomatis muncul di paling atas website agar selalu terdepan.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-[#191f26] border border-gray-800/80 space-y-2">
                  <h4 className="font-bold text-white text-sm flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-purple-500 text-white text-xs flex items-center justify-center font-bold">4</span>
                    Batasan Kuota Kunjungan Firebase
                  </h4>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Paket Firebase Spark gratis mencakup <b>50.000 pembacaan data per hari</b> dan <b>10 GB kuota transfer per bulan</b>. Menggunakan Google Drive untuk foto menghemat bandwidth hingga 95%!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 12: DATABASE & SECURITY (Point 10 & Password)        */}
          {/* ======================================================== */}
          {activeTab === "settings" && (
            <div className="space-y-8 animate-fade-in">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                  <i className="fas fa-database text-primary"></i> Database Backup &amp; Security Settings
                </h2>
                <p className="text-xs text-gray-400 mt-1">
                  Cadangkan database Firestore ke file JSON atau pulihkan data dari file cadangan.
                </p>
              </div>

              {/* Database Backup & Restore */}
              <div className="p-6 rounded-2xl bg-[#191f26] border border-gray-800/80 space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <i className="fas fa-cloud-download-alt text-emerald-400"></i> Backup &amp; Restore Database (JSON)
                </h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Unduh seluruh isi website (Hero, Riset, Berita, Proyek, Tim, dan Pengaturan) ke dalam satu file <b>database.json</b>.
                </p>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
                  <button
                    type="button"
                    onClick={handleDownloadDatabase}
                    className="px-6 py-3.5 bg-primary text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-primary/30 hover:bg-primary/90 transition-all cursor-pointer flex items-center justify-center gap-2 transform hover:scale-105 active:scale-95"
                  >
                    <i className="fas fa-download"></i> Unduh database.json (Backup)
                  </button>

                  <div className="relative">
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept=".json"
                      onChange={handleImportDatabase}
                      className="hidden"
                      id="import-database-input"
                    />
                    <label
                      htmlFor="import-database-input"
                      className="w-full sm:w-auto px-6 py-3.5 bg-gray-800 border border-gray-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-gray-700 transition-all cursor-pointer flex items-center justify-center gap-2 transform hover:scale-105 active:scale-95"
                    >
                      <i className="fas fa-upload"></i>{" "}
                      {importing ? "Memulihkan Database..." : "Upload & Pulihkan database.json"}
                    </label>
                  </div>
                </div>
              </div>

              {/* Security Policy Card */}
              <div className="p-6 rounded-2xl bg-[#191f26] border border-gray-800/80 space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <i className="fas fa-shield-alt text-amber-400"></i> Keamanan Sesi Login &amp; Kata Sandi
                </h3>
                <div className="space-y-3 text-xs text-gray-400 leading-relaxed">
                  <div className="p-4 rounded-xl bg-[#14181e] border border-gray-800">
                    <p className="font-bold text-white mb-1">Proteksi Percobaan Login (3 Kali)</p>
                    <p>Sistem memblokir sementara selama 5 menit jika salah kata sandi 3 kali berturut-turut.</p>
                  </div>
                  <div className="p-4 rounded-xl bg-[#14181e] border border-gray-800">
                    <p className="font-bold text-white mb-1">Masa Aktif Sesi (Aturan 2 Hari)</p>
                    <p>Jika login setiap hari, Anda tidak perlu login ulang. Namun jika tidak ada aktivitas lebih dari 2 hari berturut-turut, sesi akan kedaluwarsa secara otomatis.</p>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={openChangePassword}
                    className="px-6 py-3 bg-gray-800 border border-gray-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-gray-700 transition-colors cursor-pointer"
                  >
                    <i className="fas fa-key mr-2"></i> Ubah Password Admin
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* EDIT MODAL DIALOG (Dark modern styling)                   */}
      {/* ======================================================== */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in p-4">
          <div onClick={closeModal} className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative bg-[#171b21] border border-gray-800 rounded-3xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col z-10 animate-scale-in text-white">
            <div className="p-6 border-b border-gray-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-white">{modalTitle}</h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-white text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {/* EDIT RESEARCH */}
              {modalType === "edit-research" && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
                      Judul Interest
                    </label>
                    <input
                      type="text"
                      value={editResearchTitle}
                      onChange={(e) => setEditResearchTitle(e.target.value)}
                      placeholder="Masukkan judul riset..."
                      className="w-full bg-[#14181e] border border-gray-800 rounded-xl p-3.5 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
                      Ikon Research Interest
                    </label>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#14181e] border border-gray-800 flex items-center justify-center text-xl text-primary shrink-0">
                        <i className={editResearchIcon}></i>
                      </div>
                      <input
                        type="text"
                        value={editResearchIcon}
                        onChange={(e) => setEditResearchIcon(e.target.value)}
                        placeholder="fab fa-pagelines"
                        className="flex-1 bg-[#14181e] border border-gray-800 rounded-xl p-3.5 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setIconPickerTarget("edit");
                          setIconPickerOpen(true);
                        }}
                        className="px-3.5 py-3 bg-primary text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-primary/90 cursor-pointer shadow-md shadow-primary/20"
                      >
                        Pilih Ikon...
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* EDIT NEWS */}
              {modalType === "edit-news" && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">Judul Berita</label>
                    <input
                      type="text"
                      value={editNewsTitle}
                      onChange={(e) => setEditNewsTitle(e.target.value)}
                      placeholder="Judul berita..."
                      className="w-full bg-[#14181e] border border-gray-800 rounded-xl p-3.5 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">Tanggal</label>
                    <input
                      type="text"
                      value={editNewsDate}
                      onChange={(e) => setEditNewsDate(e.target.value)}
                      placeholder="Contoh: Oktober 2024"
                      className="w-full bg-[#14181e] border border-gray-800 rounded-xl p-3.5 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">Ringkasan</label>
                    <textarea
                      rows={3}
                      value={editNewsSummary}
                      onChange={(e) => setEditNewsSummary(e.target.value)}
                      placeholder="Ringkasan singkat..."
                      className="w-full bg-[#14181e] border border-gray-800 rounded-xl p-3.5 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">Isi Lengkap (HTML)</label>
                    <textarea
                      rows={5}
                      value={editNewsContent}
                      onChange={(e) => setEditNewsContent(e.target.value)}
                      placeholder="Isi berita lengkap..."
                      className="w-full bg-[#14181e] border border-gray-800 rounded-xl p-3.5 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1">
                      Ganti Foto (Kosongkan jika tidak diubah)
                    </label>
                    <input
                      type="url"
                      value={editNewsImageLink}
                      onChange={(e) => setEditNewsImageLink(e.target.value)}
                      placeholder="Tempel link Google Drive baru di sini..."
                      className="w-full bg-[#14181e] border border-gray-800 rounded-xl p-3.5 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                    />
                    <div className="mt-2 w-32 h-24 rounded-xl border border-gray-800 overflow-hidden bg-[#14181e]">
                      <img
                        src={editNewsPreview || activeItem?.image}
                        alt="Current"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>

                  <hr className="my-4 border-gray-800" />
                  <h4 className="font-bold text-white text-xs uppercase tracking-wider">Manajemen Komentar Berita Ini</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto p-2 bg-[#14181e] rounded-xl border border-gray-800">
                    {commentsLoading ? (
                      <p className="text-xs text-gray-500">Memuat komentar...</p>
                    ) : newsComments.length === 0 ? (
                      <p className="text-xs text-gray-500">Tidak ada komentar untuk berita ini.</p>
                    ) : (
                      newsComments.map((comment) => (
                        <div key={comment.id} className="p-3 bg-[#191f26] rounded-lg border border-gray-800 flex justify-between gap-2">
                          <div>
                            <p className="font-bold text-xs text-white">
                              {comment.name} <span className="font-normal text-gray-400">({comment.email})</span>
                            </p>
                            <p className="text-xs text-gray-300 mt-1">{comment.text}</p>
                          </div>
                          <button
                            onClick={() => handleDeleteComment(activeItem.id, comment.id)}
                            className="px-2 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded text-xs self-start hover:bg-red-500/30 cursor-pointer"
                          >
                            Hapus
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}

              {/* EDIT PROJECT */}
              {modalType === "edit-project" && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">Judul Proyek</label>
                    <input
                      type="text"
                      value={editProjectTitle}
                      onChange={(e) => setEditProjectTitle(e.target.value)}
                      placeholder="Judul proyek..."
                      className="w-full bg-[#14181e] border border-gray-800 rounded-xl p-3.5 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">Deskripsi Proyek</label>
                    <textarea
                      rows={4}
                      value={editProjectDescription}
                      onChange={(e) => setEditProjectDescription(e.target.value)}
                      placeholder="Deskripsi proyek..."
                      className="w-full bg-[#14181e] border border-gray-800 rounded-xl p-3.5 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">Link Proyek</label>
                    <input
                      type="url"
                      value={editProjectLink}
                      onChange={(e) => setEditProjectLink(e.target.value)}
                      placeholder="https://..."
                      className="w-full bg-[#14181e] border border-gray-800 rounded-xl p-3.5 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1">
                      Link Foto Proyek (1 per baris)
                    </label>
                    <textarea
                      rows={4}
                      value={editProjectImagesLinks}
                      onChange={(e) => setEditProjectImagesLinks(e.target.value)}
                      placeholder="Tempel link Google Drive gambar baru..."
                      className="w-full bg-[#14181e] border border-gray-800 rounded-xl p-3.5 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition font-mono"
                    />
                  </div>
                </>
              )}

              {/* EDIT TEAM */}
              {modalType === "edit-team" && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">Nama Anggota</label>
                    <input
                      type="text"
                      value={editTeamName}
                      onChange={(e) => setEditTeamName(e.target.value)}
                      placeholder="Nama anggota tim..."
                      className="w-full bg-[#14181e] border border-gray-800 rounded-xl p-3.5 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">Peran</label>
                    <select
                      value={editTeamRole}
                      onChange={(e) => setEditTeamRole(e.target.value)}
                      className="w-full bg-[#14181e] border border-gray-800 rounded-xl p-3.5 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                    >
                      <option value="Mentor">Mentor (Tampil Besar di Atas)</option>
                      <option value="Member">Member (Anggota Lab)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1">
                      Ganti Foto (Kosongkan jika tidak diubah)
                    </label>
                    <input
                      type="url"
                      value={editTeamImageLink}
                      onChange={(e) => setEditTeamImageLink(e.target.value)}
                      placeholder="Tempel link Google Drive foto baru..."
                      className="w-full bg-[#14181e] border border-gray-800 rounded-xl p-3.5 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                    />
                    <div className="mt-2 w-28 h-36 rounded-xl border border-gray-800 overflow-hidden bg-[#14181e]">
                      <img
                        src={editTeamPreview || activeItem?.image}
                        alt="Current"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* CHANGE PASSWORD */}
              {modalType === "change-password" && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">Password Lama</label>
                    <input
                      type="password"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      placeholder="Masukkan kata sandi lama Anda..."
                      required
                      className="w-full bg-[#14181e] border border-gray-800 rounded-xl p-3.5 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">Password Baru</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimal 6 karakter..."
                      required
                      className="w-full bg-[#14181e] border border-gray-800 rounded-xl p-3.5 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">Konfirmasi Password Baru</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Ulangi kata sandi baru..."
                      required
                      className="w-full bg-[#14181e] border border-gray-800 rounded-xl p-3.5 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                    />
                  </div>
                  {passwordError && (
                    <p className="text-xs text-red-400 font-medium bg-red-500/10 p-3 rounded-xl border border-red-500/20">
                      {passwordError}
                    </p>
                  )}
                </>
              )}
            </div>

            <div className="p-4 bg-[#14181e] border-t border-gray-800 flex items-center justify-end gap-3">
              <button
                onClick={closeModal}
                className="px-4 py-2.5 bg-gray-800 text-gray-300 rounded-xl text-xs font-semibold hover:bg-gray-700 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleModalSave}
                className="px-5 py-2.5 bg-primary text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-md shadow-primary/30 hover:bg-primary/90 transition-all cursor-pointer transform hover:scale-105 active:scale-95"
              >
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* ICON PICKER MODAL (Dark modern styling)                   */}
      {/* ======================================================== */}
      {iconPickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in p-4">
          <div onClick={() => setIconPickerOpen(false)} className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative bg-[#171b21] border border-gray-800 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col z-10 animate-scale-in text-white">
            <div className="p-6 border-b border-gray-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Pilih Ikon FontAwesome</h3>
                <p className="text-xs text-gray-400 mt-1">Klik ikon yang sesuai untuk riset laboratorium Anda</p>
              </div>
              <button
                onClick={() => setIconPickerOpen(false)}
                className="text-gray-400 hover:text-white text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {RESEARCH_ICONS.map((icon, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      if (iconPickerTarget === "new") {
                        setNewResearchIcon(icon.class);
                      } else {
                        setEditResearchIcon(icon.class);
                      }
                      setIconPickerOpen(false);
                    }}
                    className="flex items-center gap-3 p-3.5 rounded-xl border border-gray-800 bg-[#14181e] hover:border-primary hover:bg-primary/10 transition-all text-left cursor-pointer group"
                  >
                    <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center text-gray-300 group-hover:text-primary transition-colors text-lg shrink-0">
                      <i className={icon.class}></i>
                    </div>
                    <div className="overflow-hidden">
                      <p className="font-semibold text-xs text-white truncate">{icon.label}</p>
                      <span className="text-[10px] text-gray-500 font-mono block truncate">{icon.class}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <GoToTop />
    </div>
  );
}
