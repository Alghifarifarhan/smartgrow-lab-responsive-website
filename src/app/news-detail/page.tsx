"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { db, convertGoogleDriveLink } from "@/lib/firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { recordVisit } from "@/lib/analytics";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import GoToTop from "@/components/GoToTop";
import type { NewsItem, CommentItem, SiteContent } from "@/types";

function NewsDetailContent() {
  const searchParams = useSearchParams();
  const newsId = searchParams.get("id");

  const [news, setNews] = useState<NewsItem | null>(null);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [siteContent, setSiteContent] = useState<SiteContent>({});
  const [loading, setLoading] = useState(true);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form states
  const [commentName, setCommentName] = useState("");
  const [commentEmail, setCommentEmail] = useState("");
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    recordVisit();

    async function loadFooter() {
      try {
        const mainDoc = await getDoc(doc(db, "siteContent", "main"));
        if (mainDoc.exists()) {
          setSiteContent(mainDoc.data() as SiteContent);
        }
      } catch (err) {
        console.error("Error loading footer data:", err);
      }
    }
    loadFooter();
  }, []);

  const loadComments = async (id: string) => {
    setCommentsLoading(true);
    try {
      const q = query(
        collection(db, "newsAndEvents", id, "comments"),
        orderBy("createdAt", "desc")
      );
      const snap = await getDocs(q);
      const list: CommentItem[] = [];
      snap.forEach((d) => {
        list.push({ id: d.id, ...(d.data() as Omit<CommentItem, "id">) });
      });
      setComments(list);
    } catch (err) {
      console.error("Error loading comments:", err);
    } finally {
      setCommentsLoading(false);
    }
  };

  useEffect(() => {
    if (!newsId) {
      setErrorMsg("Error: Berita tidak ditemukan.");
      setLoading(false);
      return;
    }

    async function loadNews() {
      setLoading(true);
      try {
        const docRef = doc(db, "newsAndEvents", newsId as string);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data() as Omit<NewsItem, "id">;
          setNews({ id: docSnap.id, ...data });
          document.title = `${data.title} - Smart Grow Lab`;
          loadComments(newsId as string);
        } else {
          setErrorMsg("Error: Berita ini tidak ada.");
        }
      } catch (err) {
        console.error("Error loading news detail:", err);
        setErrorMsg("Gagal memuat konten berita.");
      } finally {
        setLoading(false);
      }
    }

    loadNews();
  }, [newsId]);

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentName.trim() || !commentEmail.trim() || !commentText.trim()) {
      alert("Harap isi semua kolom.");
      return;
    }
    if (!newsId) return;

    setSubmitting(true);
    try {
      await addDoc(collection(db, "newsAndEvents", newsId, "comments"), {
        name: commentName.trim(),
        email: commentEmail.trim(),
        text: commentText.trim(),
        createdAt: serverTimestamp(),
      });
      setCommentName("");
      setCommentEmail("");
      setCommentText("");
      alert("Komentar berhasil dikirim!");
      loadComments(newsId);
    } catch (err) {
      console.error("Error adding comment: ", err);
      alert("Gagal mengirim komentar.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatCommentDate = (createdAt: unknown) => {
    if (!createdAt) return "Baru saja";
    if (createdAt instanceof Timestamp) {
      return createdAt.toDate().toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    }
    if (typeof createdAt === "object" && "toDate" in (createdAt as any)) {
      return (createdAt as any).toDate().toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    }
    return "Baru saja";
  };

  return (
    <>
      <Navbar isHomePage={false} joinUsLink={siteContent.joinUsLink} />

      <main className="container mx-auto p-6 md:p-12 min-h-screen">
        {loading && (
          <div
            id="loader"
            className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in"
          >
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary"></div>
          </div>
        )}

        {errorMsg && (
          <div className="max-w-4xl mx-auto my-12 text-center animate-fade-in">
            <p className="text-red-500 font-bold bg-red-50 py-4 px-6 rounded-xl border border-red-200">
              {errorMsg}
            </p>
          </div>
        )}

        {news && !loading && (
          <>
            <article
              id="news-content-container"
              className="bg-white p-6 md:p-10 rounded-2xl shadow-md max-w-4xl mx-auto animate-fade-in-up"
            >
              <h1
                id="news-detail-title"
                className="text-3xl md:text-4xl font-bold mb-3 text-gray-900 leading-tight"
              >
                {news.title}
              </h1>
              <p id="news-detail-date" className="text-gray-500 mb-8 font-medium">
                {news.date}
              </p>

              <div className="flex justify-center mb-8 overflow-hidden rounded-xl bg-gray-50">
                <img
                  id="news-detail-image"
                  src={convertGoogleDriveLink(news.image)}
                  alt={news.title}
                  className="h-auto max-w-full max-h-[500px] object-cover rounded-xl shadow-sm transition-transform duration-500 hover:scale-[1.02]"
                />
              </div>
              <div
                id="news-detail-content"
                className="prose max-w-none text-gray-700 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: news.content }}
              />
            </article>

            <section id="comments-section" className="max-w-4xl mx-auto mt-12 animate-fade-in-up delay-100">
              <h2 className="text-2xl font-bold mb-6">Komentar</h2>

              <div id="comments-list" className="space-y-4">
                {commentsLoading ? (
                  <p className="text-gray-500 py-4">Memuat komentar...</p>
                ) : comments.length === 0 ? (
                  <div className="bg-white p-6 rounded-xl border border-gray-100 text-center text-gray-500">
                    Belum ada komentar. Jadilah yang pertama!
                  </div>
                ) : (
                  comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="p-5 bg-white rounded-xl border border-gray-100 shadow-sm transition-all hover:shadow-md"
                    >
                      <div className="flex items-center mb-2">
                        <p className="font-bold text-gray-800">{comment.name}</p>
                        <span className="text-gray-400 text-sm ml-auto">
                          {formatCommentDate(comment.createdAt)}
                        </span>
                      </div>
                      <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">
                        {comment.text}
                      </p>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-10 bg-white p-8 rounded-2xl shadow-md border border-gray-100">
                <h3 className="text-xl font-bold mb-4">Tinggalkan Komentar</h3>
                <form id="comment-form" onSubmit={handleCommentSubmit} className="space-y-4">
                  <div>
                    <label
                      htmlFor="comment-name"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Nama
                    </label>
                    <input
                      type="text"
                      id="comment-name"
                      value={commentName}
                      onChange={(e) => setCommentName(e.target.value)}
                      placeholder="Masukkan nama lengkap Anda..."
                      required
                      className="w-full border border-gray-300 rounded-lg shadow-sm p-3 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="comment-email"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Email
                    </label>
                    <input
                      type="email"
                      id="comment-email"
                      value={commentEmail}
                      onChange={(e) => setCommentEmail(e.target.value)}
                      placeholder="contoh@email.com"
                      required
                      className="w-full border border-gray-300 rounded-lg shadow-sm p-3 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="comment-text"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Komentar
                    </label>
                    <textarea
                      id="comment-text"
                      rows={4}
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Tuliskan komentar atau pertanyaan Anda di sini..."
                      required
                      className="w-full border border-gray-300 rounded-lg shadow-sm p-3 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-3 bg-primary text-white font-semibold rounded-full shadow-md shadow-primary/40 hover:bg-primary/90 transition-all duration-300 transform hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? "Mengirim..." : "Kirim Komentar"}
                  </button>
                </form>
              </div>
            </section>
          </>
        )}
      </main>

      <Footer footerData={siteContent.footer} className="mt-12" />
      <GoToTop />
    </>
  );
}

export default function NewsDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary"></div>
        </div>
      }
    >
      <NewsDetailContent />
    </Suspense>
  );
}
