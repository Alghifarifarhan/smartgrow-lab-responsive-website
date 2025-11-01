// Konfigurasi Firebase Anda
const firebaseConfig = {
  apiKey: "Your-API-Key",
  authDomain: "Your-authDomain.firebaseapp.com",
  projectId: "Your-projectId",
  storageBucket: "Your-storageBucket.appspot.com",
  messagingSenderId: "Your-messagingSenderId",
  appId: "Your-appId",
  measurementId: "Your-measurementId",
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// --- GLOBAL ELEMENTS ---
const loader = document.getElementById("loader");
const modal = document.getElementById("edit-modal");
const modalTitle = document.getElementById("modal-title");
const modalBody = document.getElementById("modal-body");
const modalSaveBtn = document.getElementById("modal-save-btn");
const goToTopButton = document.getElementById("go-to-top");

// --- FUNGSI KONVERSI LINK (VERSI FINAL) ---
function convertGoogleDriveLink(shareLink) {
  if (!shareLink) return "";

  // Cek jika ini adalah link gambar langsung (dari ImgBB, dll)
  if (/\.(jpeg|jpg|gif|png|webp)$/i.test(shareLink)) {
    return shareLink; // Langsung kembalikan jika sudah direct link
  }

  // Jika bukan, coba proses sebagai link Google Drive
  if (shareLink.includes("drive.google.com")) {
    const regex = /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/;
    const match = shareLink.match(regex);
    if (match && match[1]) {
      const fileId = match[1];
      // Menggunakan format thumbnail yang lebih andal untuk menghindari halaman virus-scan
      // &sz=w1000 mengatur lebar gambar menjadi 1000px, bisa disesuaikan
      return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
    }
  }

  return ""; // Kembalikan string kosong jika tidak ada format yang cocok
}

// --- AUTHENTICATION CHECK ---
auth.onAuthStateChanged((user) => {
  if (!user) {
    window.location.href = "login.html";
  } else {
    console.log("Admin logged in:", user.email);
    loadAllData();
  }
});

document.getElementById("logout-button").addEventListener("click", () => {
  auth.signOut().then(() => (window.location.href = "login.html"));
});

// --- FUNGSI IMAGE PREVIEW ---
function showImagePreview(inputId, previewId) {
  const inputElement = document.getElementById(inputId);
  const previewContainer = document.getElementById(previewId);

  if (!inputElement || !previewContainer) return;

  const updatePreview = () => {
    previewContainer.innerHTML = ""; // Bersihkan preview
    const isMultiple = inputElement.tagName.toLowerCase() === "textarea";
    const links = isMultiple
      ? inputElement.value.split("\n").filter(Boolean)
      : [inputElement.value];

    if (links.length === 0 || links[0] === "") {
      const defaultText = isMultiple
        ? "Preview gambar akan muncul di sini"
        : "Preview Gambar";
      previewContainer.innerHTML = `<div class="flex items-center justify-center h-full text-gray-500">${defaultText}</div>`;
      return;
    }

    links.forEach((link) => {
      const directLink = convertGoogleDriveLink(link);
      if (directLink) {
        const imgWrapperClass = isMultiple
          ? "relative w-24 h-24 border rounded overflow-hidden m-1"
          : "w-full h-full";
        const imgWrapper = document.createElement("div");
        imgWrapper.className = imgWrapperClass;

        const img = document.createElement("img");
        img.src = directLink;
        img.className = "w-full h-full object-cover";
        img.onerror = () => {
          imgWrapper.innerHTML = `<div class="p-1 text-center text-red-500 text-xs leading-tight">Gagal muat. Periksa link & permission.</div>`;
        };
        imgWrapper.appendChild(img);
        previewContainer.appendChild(imgWrapper);
      }
    });
  };

  updatePreview();
  inputElement.addEventListener("input", updatePreview);
}

// --- FUNGSI LOAD & SAVE DATA ---
async function loadAllData() {
  loader.style.display = "flex";
  try {
    // Aktifkan preview untuk form utama
    showImagePreview("news-image-link", "news-image-preview");
    showImagePreview("project-images-links", "project-images-preview");
    showImagePreview("team-image-link", "team-image-preview");

    const docRef = db.collection("siteContent").doc("main");
    const doc = await docRef.get();
    if (doc.exists) {
      const data = doc.data();
      // Load data ke form utama
      document.getElementById("hero-title").value = data.heroTitle || "";
      document.getElementById("hero-description").value =
        data.heroDescription || "";
      document.getElementById("stat-partners").value =
        data.stats?.partners || "";
      document.getElementById("stat-projects").value =
        data.stats?.projects || "";
      document.getElementById("stat-increase").value =
        data.stats?.increase || "";
      document.getElementById("stat-members").value = data.stats?.members || "";
      document.getElementById("footer-address").value =
        data.footer?.address || "";
      document.getElementById("footer-research").value = (
        data.footer?.research || []
      )
        .map((l) => `${l.text}|${l.url}`)
        .join("\n");
      document.getElementById("footer-contact").value = (
        data.footer?.contact || []
      )
        .map((c) => `${c.text}|${c.url}`)
        .join("\n");
      document.getElementById("join-us-link").value = data.joinUsLink || "";
    }
    // Load data list
    loadList(
      "researchInterests",
      "research-list",
      (item) => `${item.title} (${item.iconLink})`,
      "createdAt",
      openEditResearchModal
    );
    loadList(
      "newsAndEvents",
      "news-list",
      (item) => `${item.title} - ${item.date}`,
      "createdAt",
      openEditNewsModal
    );
    loadList(
      "projects",
      "project-list",
      (item) => item.title,
      "createdAt",
      openEditProjectModal
    );
    loadList(
      "teamMembers",
      "team-list",
      (item) => `${item.name} (${item.role})`,
      "name",
      openEditTeamModal
    );
  } catch (error) {
    console.error("Error loading data:", error);
    alert("Gagal memuat data.");
  } finally {
    loader.style.display = "none";
  }
}

async function loadList(
  collectionName,
  listElementId,
  displayFn,
  orderByField,
  editFn
) {
  const listElement = document.getElementById(listElementId);
  listElement.innerHTML = "";
  const snapshot = await db
    .collection(collectionName)
    .orderBy(orderByField)
    .get();
  snapshot.forEach((doc) => {
    const item = doc.data();
    const div = document.createElement("div");
    div.className = "flex justify-between items-center p-2 bg-gray-100 rounded";
    const textSpan = document.createElement("span");
    textSpan.textContent = displayFn(item);
    const buttonsWrapper = document.createElement("div");
    buttonsWrapper.className = "space-x-2";
    const editButton = document.createElement("button");
    editButton.textContent = "Edit";
    editButton.className =
      "px-2 py-1 bg-yellow-500 text-white rounded text-sm hover:bg-yellow-600";
    editButton.onclick = () => editFn(doc.id, item);
    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Hapus";
    deleteButton.className =
      "px-2 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600";
    deleteButton.onclick = () =>
      deleteItem(collectionName, doc.id, () =>
        loadList(collectionName, listElementId, displayFn, orderByField, editFn)
      );
    buttonsWrapper.appendChild(editButton);
    buttonsWrapper.appendChild(deleteButton);
    div.appendChild(textSpan);
    div.appendChild(buttonsWrapper);
    listElement.appendChild(div);
  });
}

async function deleteItem(collectionName, docId, refreshFn) {
  if (
    confirm(
      "Anda yakin ingin menghapus item ini? Tindakan ini tidak dapat dibatalkan."
    )
  ) {
    await db.collection(collectionName).doc(docId).delete();
    alert("Item berhasil dihapus.");
    refreshFn();
  }
}

// --- MODAL FUNCTIONS ---
function openModal(title, formHTML, saveCallback) {
  modalTitle.textContent = title;
  modalBody.innerHTML = formHTML;
  modal.classList.remove("hidden");
  modal.classList.add("flex");
  setTimeout(() => {
    document.getElementById("modal-backdrop").classList.remove("opacity-0");
    document.getElementById("modal-content").classList.remove("scale-95");
  }, 10);
  modalSaveBtn.onclick = saveCallback;
}

function closeModal() {
  document.getElementById("modal-backdrop").classList.add("opacity-0");
  document.getElementById("modal-content").classList.add("scale-95");
  setTimeout(() => {
    modal.classList.add("hidden");
    modal.classList.remove("flex");
    modalBody.innerHTML = "";
  }, 300);
}

document
  .getElementById("modal-close-btn")
  .addEventListener("click", closeModal);
document.getElementById("modal-backdrop").addEventListener("click", closeModal);

// --- EDIT MODAL IMPLEMENTATIONS ---

function openEditResearchModal(docId, item) {
  const formHTML = `
        <div><label class="block text-sm font-medium">Judul Interest</label><input type="text" id="edit-research-title" value="${item.title}" required class="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2"></div>
        <div><label class="block text-sm font-medium">Link Ikon</label><input type="text" id="edit-research-icon" value="${item.iconLink}" required class="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2"></div>
    `;
  openModal("Edit Research Interest", formHTML, async () => {
    const updatedData = {
      title: document.getElementById("edit-research-title").value,
      iconLink: document.getElementById("edit-research-icon").value,
    };
    await db.collection("researchInterests").doc(docId).update(updatedData);
    alert("Update berhasil!");
    closeModal();
    loadList(
      "researchInterests",
      "research-list",
      (i) => `${i.title} (${i.iconLink})`,
      "createdAt",
      openEditResearchModal
    );
  });
}

async function deleteComment(newsId, commentId) {
  if (confirm("Anda yakin ingin menghapus komentar ini?")) {
    try {
      await db
        .collection("newsAndEvents")
        .doc(newsId)
        .collection("comments")
        .doc(commentId)
        .delete();
      alert("Komentar berhasil dihapus.");
      loadCommentsForAdmin(newsId);
    } catch (error) {
      console.error("Error deleting comment: ", error);
      alert("Gagal menghapus komentar.");
    }
  }
}

async function loadCommentsForAdmin(newsId) {
  const listContainer = document.getElementById("comments-management-list");
  if (!listContainer) return;
  listContainer.innerHTML = '<p class="text-sm">Memuat komentar...</p>';
  const commentsSnapshot = await db
    .collection("newsAndEvents")
    .doc(newsId)
    .collection("comments")
    .orderBy("createdAt", "desc")
    .get();
  if (commentsSnapshot.empty) {
    listContainer.innerHTML =
      '<p class="text-sm text-gray-500">Tidak ada komentar untuk berita ini.</p>';
    return;
  }
  listContainer.innerHTML = "";
  commentsSnapshot.forEach((doc) => {
    const comment = doc.data();
    const commentId = doc.id;
    const commentDate = comment.createdAt.toDate().toLocaleDateString("id-ID");
    const div = document.createElement("div");
    div.className = "p-3 bg-gray-100 rounded-md mb-2";
    div.innerHTML = `
      <div class="flex justify-between items-start">
        <div>
          <p class="font-bold text-sm">${comment.name} <span class="font-normal text-gray-500">(${comment.email})</span></p>
          <p class="text-gray-700 mt-1 text-sm">${comment.text}</p>
        </div>
        <div class="text-right flex-shrink-0 ml-2">
            <p class="text-xs text-gray-500 mb-2">${commentDate}</p>
            <button class="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600">Hapus</button>
        </div>
      </div>
    `;
    div.querySelector("button").onclick = () =>
      deleteComment(newsId, commentId);
    listContainer.appendChild(div);
  });
}

function openEditNewsModal(docId, item) {
  const formHTML = `
    <div class="max-h-[60vh] overflow-y-auto pr-4 space-y-4">
        <div><label class="block text-sm font-medium">Judul</label><input type="text" id="edit-news-title" value="${item.title}" required class="mt-1 block w-full p-2 border rounded"></div>
        <div><label class="block text-sm font-medium">Tanggal</label><input type="text" id="edit-news-date" value="${item.date}" required class="mt-1 block w-full p-2 border rounded"></div>
        <div><label class="block text-sm font-medium">Summary</label><textarea id="edit-news-summary" rows="3" required class="mt-1 block w-full p-2 border rounded">${item.summary}</textarea></div>
        <div><label class="block text-sm font-medium">Content (HTML didukung)</label><textarea id="edit-news-content" rows="5" required class="mt-1 block w-full p-2 border rounded">${item.content}</textarea></div>
        <div>
          <label class="block text-sm font-medium">Link Gambar (Isi untuk mengubah)</label>
          <input type="url" id="edit-news-image-link" class="mt-1 block w-full p-2 border rounded" placeholder="Tempel link baru di sini...">
          <div class="mt-2 text-xs">Gambar saat ini:</div>
          <img src="${item.image}" class="mt-1 w-32 h-auto border rounded"/>
        </div>
        <hr class="my-6">
        <h4 class="text-lg font-bold mb-3">Manajemen Komentar</h4>
        <div id="comments-management-list" class="space-y-2 max-h-60 overflow-y-auto p-2 bg-gray-50 rounded border"></div>
    </div>
    `;
  openModal("Edit News & Event", formHTML, async () => {
    const newShareLink = document.getElementById("edit-news-image-link").value;
    const updatedData = {
      title: document.getElementById("edit-news-title").value,
      date: document.getElementById("edit-news-date").value,
      summary: document.getElementById("edit-news-summary").value,
      content: document.getElementById("edit-news-content").value,
    };
    if (newShareLink) {
      const directLink = convertGoogleDriveLink(newShareLink);
      if (directLink) {
        updatedData.image = directLink;
      } else {
      }
    }
    await db.collection("newsAndEvents").doc(docId).update(updatedData);
    alert("Update berhasil!");
    closeModal();
    loadList(
      "newsAndEvents",
      "news-list",
      (i) => `${i.title} - ${i.date}`,
      "createdAt",
      openEditNewsModal
    );
  });
  loadCommentsForAdmin(docId);
}

function openEditProjectModal(docId, item) {
  const currentLinksText = (item.images || []).join("\n");

  const formHTML = `
        <div><label class="block text-sm font-medium">Judul</label><input type="text" id="edit-project-title" value="${
          item.title
        }" required class="mt-1 block w-full p-2 border rounded"></div>
        <div><label class="block text-sm font-medium">Deskripsi</label><textarea id="edit-project-description" rows="4" required class="mt-1 block w-full p-2 border rounded">${
          item.description
        }</textarea></div>
        <div><label class="block text-sm font-medium">Link Proyek (Opsional)</label><input type="url" id="edit-project-link" value="${
          item.link || ""
        }" class="mt-1 block w-full p-2 border rounded" placeholder="https://example.com/project-detail"></div>
        <div>
            <label class="block text-sm font-medium">Link Gambar (satu per baris)</label>
            <p class="text-xs text-gray-500 mb-1">Kosongkan kolom ini jika tidak ingin mengubah gambar yang sudah ada.</p>
            <textarea id="edit-project-images-links" rows="5" class="mt-1 block w-full p-2 border rounded" placeholder="Tempel link gambar baru di sini...">${currentLinksText}</textarea>
        </div>
    `;
  openModal("Edit Project", formHTML, async () => {
    const linksText = document.getElementById(
      "edit-project-images-links"
    ).value;

    // MODIFIED: Start with basic data
    const updatedData = {
      title: document.getElementById("edit-project-title").value,
      description: document.getElementById("edit-project-description").value,
      link: document.getElementById("edit-project-link").value,
    };

    // MODIFIED: Only update images if the textarea is not empty
    if (linksText.trim() !== "") {
      const images = linksText
        .split("\n")
        .filter(Boolean)
        .map(convertGoogleDriveLink)
        .filter(Boolean);

      // Only add to updatedData if there are valid new images
      if (images.length > 0) {
        updatedData.images = images;
      } else {
        alert();
      }
    }

    await db.collection("projects").doc(docId).update(updatedData);
    alert("Update berhasil!");
    closeModal();
    loadList(
      "projects",
      "project-list",
      (i) => i.title,
      "createdAt",
      openEditProjectModal
    );
  });
}

function openEditTeamModal(docId, item) {
  const formHTML = `
        <div><label class="block text-sm font-medium">Nama</label><input type="text" id="edit-team-name" value="${item.name}" required class="mt-1 block w-full p-2 border rounded"></div>
        <div><label class="block text-sm font-medium">Peran</label><select id="edit-team-role" required class="mt-1 block w-full p-2 border rounded"><option value="Mentor">Mentor</option><option value="Member">Member</option></select></div>
        <div>
          <label class="block text-sm font-medium">Link Foto (Isi untuk mengubah)</label>
          <input type="url" id="edit-team-image-link" class="mt-1 block w-full p-2 border rounded" placeholder="Tempel link baru di sini...">
          <div class="mt-2 text-xs">Foto saat ini:</div>
          <img src="${item.image}" class="mt-1 w-32 h-auto border rounded"/>
        </div>
    `;
  openModal("Edit Team Member", formHTML, async () => {
    const newShareLink = document.getElementById("edit-team-image-link").value;
    const updatedData = {
      name: document.getElementById("edit-team-name").value,
      role: document.getElementById("edit-team-role").value,
    };
    if (newShareLink) {
      const directLink = convertGoogleDriveLink(newShareLink);
      if (directLink) {
        updatedData.image = directLink;
      } else {
        alert("Link foto baru tidak valid. Foto tidak akan diubah.");
      }
    }
    await db.collection("teamMembers").doc(docId).update(updatedData);
    alert("Update berhasil!");
    closeModal();
    loadList(
      "teamMembers",
      "team-list",
      (i) => `${i.name} (${i.role})`,
      "name",
      openEditTeamModal
    );
  });
  document.getElementById("edit-team-role").value = item.role;
}

// --- CHANGE PASSWORD ---
document.getElementById("change-password-btn").addEventListener("click", () => {
  const formHTML = `
        <p class="text-sm text-gray-600">Untuk keamanan, masukkan password lama Anda terlebih dahulu, lalu masukkan password baru.</p>
        <div><label class="block text-sm font-medium">Password Lama</label><div class="relative mt-1"><input type="password" id="old-password" required class="block w-full p-2 border rounded-md shadow-sm pr-10"></div></div>
        <div><label class="block text-sm font-medium">Password Baru</label><div class="relative mt-1"><input type="password" id="new-password" required class="block w-full p-2 border rounded-md shadow-sm pr-10"></div></div>
        <div><label class="block text-sm font-medium">Konfirmasi Password Baru</label><div class="relative mt-1"><input type="password" id="confirm-password" required class="block w-full p-2 border rounded-md shadow-sm pr-10"></div></div>
        <p id="password-error" class="text-red-500 text-sm mt-2"></p>`;
  openModal("Ubah Password", formHTML, async () => {
    const oldPass = document.getElementById("old-password").value;
    const newPass = document.getElementById("new-password").value;
    const confirmPass = document.getElementById("confirm-password").value;
    const errorP = document.getElementById("password-error");
    errorP.textContent = "";
    if (!newPass || !oldPass) {
      errorP.textContent = "Semua kolom password harus diisi.";
      return;
    }
    if (newPass !== confirmPass) {
      errorP.textContent = "Password baru tidak cocok.";
      return;
    }
    if (newPass.length < 6) {
      errorP.textContent = "Password baru minimal harus 6 karakter.";
      return;
    }
    const user = auth.currentUser;
    const credential = firebase.auth.EmailAuthProvider.credential(
      user.email,
      oldPass
    );
    try {
      await user.reauthenticateWithCredential(credential);
      await user.updatePassword(newPass);
      alert("Password berhasil diubah!");
      closeModal();
    } catch (error) {
      console.error(error);
      errorP.textContent = "Password lama salah. Silakan coba lagi.";
    }
  });
});

// --- GO TO TOP BUTTON ---
window.addEventListener("scroll", () => {
  goToTopButton.style.opacity = window.scrollY > 300 ? "1" : "0";
});
goToTopButton.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});

// --- FORM SUBMISSION HANDLERS ---
async function saveMainContent(e) {
  e.preventDefault();
  const dataToSave = {
    heroTitle: document.getElementById("hero-title").value,
    heroDescription: document.getElementById("hero-description").value,
    stats: {
      partners: document.getElementById("stat-partners").value,
      projects: document.getElementById("stat-projects").value,
      increase: document.getElementById("stat-increase").value,
      members: document.getElementById("stat-members").value,
    },
    footer: {
      address: document.getElementById("footer-address").value,
      research: document
        .getElementById("footer-research")
        .value.split("\n")
        .filter(Boolean)
        .map((line) => {
          const [text, url] = line.split("|");
          return { text: text.trim(), url: (url || "").trim() };
        }),
      contact: document
        .getElementById("footer-contact")
        .value.split("\n")
        .filter(Boolean)
        .map((line) => {
          const [text, url] = line.split("|");
          return { text: text.trim(), url: (url || "").trim() };
        }),
    },
    joinUsLink: document.getElementById("join-us-link").value,
  };
  try {
    await db
      .collection("siteContent")
      .doc("main")
      .set(dataToSave, { merge: true });
    alert("Data berhasil disimpan!");
  } catch (error) {
    console.error("Error saving main content: ", error);
    alert("Gagal menyimpan data.");
  }
}

document
  .getElementById("hero-form")
  .addEventListener("submit", saveMainContent);
document
  .getElementById("stats-form")
  .addEventListener("submit", saveMainContent);
document
  .getElementById("footer-form")
  .addEventListener("submit", saveMainContent);
document
  .getElementById("join-us-form")
  .addEventListener("submit", saveMainContent);

function handleFormSubmit(formId, collectionName, dataBuilder, refreshFn) {
  document.getElementById(formId).addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      const data = dataBuilder();
      if (!data) return; // Batal jika data builder mengembalikan null
      await db.collection(collectionName).add(data);
      alert("Data berhasil ditambahkan.");
      e.target.reset();
      // Reset all previews after submission
      document
        .querySelectorAll(".preview-container")
        .forEach(
          (p) =>
            (p.innerHTML =
              '<div class="flex items-center justify-center h-full text-gray-500">Preview Gambar</div>')
        );
      document.querySelector("#project-images-preview").innerHTML = "";
      if (refreshFn) refreshFn();
    } catch (error) {
      console.error("Error adding document: ", error);
      alert("Gagal menambahkan data.");
    }
  });
}

handleFormSubmit(
  "research-form",
  "researchInterests",
  () => ({
    title: document.getElementById("research-title").value,
    iconLink: document.getElementById("research-icon").value,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
  }),
  () =>
    loadList(
      "researchInterests",
      "research-list",
      (i) => `${i.title} (${i.iconLink})`,
      "createdAt",
      openEditResearchModal
    )
);

handleFormSubmit(
  "news-form",
  "newsAndEvents",
  () => {
    const shareLink = document.getElementById("news-image-link").value;
    const directLink = convertGoogleDriveLink(shareLink);
    if (!directLink) {
      alert("Link gambar berita tidak valid!");
      return null;
    }
    return {
      title: document.getElementById("news-title").value,
      date: document.getElementById("news-date").value,
      summary: document.getElementById("news-summary").value,
      content: document.getElementById("news-content").value,
      image: directLink,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    };
  },
  () =>
    loadList(
      "newsAndEvents",
      "news-list",
      (i) => `${i.title} - ${i.date}`,
      "createdAt",
      openEditNewsModal
    )
);

handleFormSubmit(
  "project-form",
  "projects",
  () => {
    const linksText = document.getElementById("project-images-links").value;
    const images = linksText
      .split("\n")
      .filter(Boolean)
      .map(convertGoogleDriveLink)
      .filter(Boolean);
    if (images.length === 0) {
      alert("Masukkan setidaknya satu link gambar yang valid untuk proyek.");
      return null;
    }
    return {
      title: document.getElementById("project-title").value,
      description: document.getElementById("project-description").value,
      link: document.getElementById("project-link").value,
      images: images,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    };
  },
  () =>
    loadList(
      "projects",
      "project-list",
      (i) => i.title,
      "createdAt",
      openEditProjectModal
    )
);

handleFormSubmit(
  "team-form",
  "teamMembers",
  () => {
    const shareLink = document.getElementById("team-image-link").value;
    const directLink = convertGoogleDriveLink(shareLink);
    if (!directLink) {
      alert("Link foto anggota tidak valid!");
      return null;
    }
    return {
      name: document.getElementById("team-name").value,
      role: document.getElementById("team-role").value,
      image: directLink,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    };
  },
  () =>
    loadList(
      "teamMembers",
      "team-list",
      (i) => `${i.name} (${i.role})`,
      "name",
      openEditTeamModal
    )
);
