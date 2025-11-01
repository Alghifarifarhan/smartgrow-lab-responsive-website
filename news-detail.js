document.addEventListener("DOMContentLoaded", () => {
  // --- Konfigurasi Firebase ---
  const firebaseConfig = {
    apiKey: "Your-API-Key",
    authDomain: "Your-authDomain.firebaseapp.com",
    projectId: "Your-projectId",
    storageBucket: "Your-storageBucket.appspot.com",
    messagingSenderId: "Your-messagingSenderId",
    appId: "Your-appId",
    measurementId: "Your-measurementId",
  };

  firebase.initializeApp(firebaseConfig);
  const db = firebase.firestore();

  // --- UI Elements ---
  const loader = document.getElementById("loader");
  const newsContentContainer = document.getElementById(
    "news-content-container"
  );
  const commentsSection = document.getElementById("comments-section");
  const commentForm = document.getElementById("comment-form");
  const goToTopButton = document.getElementById("go-to-top");
  const mobileMenuButton = document.getElementById("mobile-menu-button");
  const mobileMenu = document.getElementById("mobile-menu");

  // --- ADDED: Function to populate mobile menu ---
  function setupMobileMenu() {
    const mobileMenuList = mobileMenu.querySelector("ul");
    const desktopNavLinks = document.querySelectorAll(
      "nav > .container > ul.hidden > li"
    );

    mobileMenuList.innerHTML = ""; // Clear existing items

    desktopNavLinks.forEach((item) => {
      mobileMenuList.appendChild(item.cloneNode(true));
    });

    const joinUsButton = document
      .querySelector(".join-us-button")
      .cloneNode(true);
    const button = joinUsButton.querySelector("button");
    button.classList.remove("hidden");
    button.classList.add("w-full", "mt-2");
    const li = document.createElement("li");
    li.appendChild(joinUsButton);
    mobileMenuList.appendChild(li);
  }

  setupMobileMenu(); // Build the menu on page load

  // --- Get News ID from URL ---
  const urlParams = new URLSearchParams(window.location.search);
  const newsId = urlParams.get("id");

  if (!newsId) {
    loader.innerHTML =
      '<p class="text-red-500 text-center font-bold">Error: Berita tidak ditemukan.</p>';
    setTimeout(() => (loader.style.display = "none"), 500);
    return;
  }

  // --- Function to load news detail ---
  async function loadNewsDetail() {
    try {
      const docRef = db.collection("newsAndEvents").doc(newsId);
      const doc = await docRef.get();

      if (doc.exists) {
        const data = doc.data();
        document.getElementById("news-detail-title").textContent = data.title;
        document.getElementById("news-detail-date").textContent = data.date;
        document.getElementById("news-detail-image").src = data.image;
        document.getElementById("news-detail-image").alt = data.title;
        document.getElementById("news-detail-content").innerHTML = data.content;

        document.title = `${data.title} - Smart Grow Lab`;

        newsContentContainer.classList.remove("hidden");
        commentsSection.classList.remove("hidden");
        setTimeout(() => (loader.style.display = "none"), 300);

        loadComments();
        loadFooterAndJoinUs();
      } else {
        loader.innerHTML =
          '<p class="text-red-500 text-center font-bold">Error: Berita ini tidak ada.</p>';
        setTimeout(() => (loader.style.display = "none"), 500);
      }
    } catch (error) {
      console.error("Error loading news detail:", error);
      loader.innerHTML =
        '<p class="text-red-500 text-center font-bold">Gagal memuat konten berita.</p>';
      setTimeout(() => (loader.style.display = "none"), 500);
    }
  }

  // --- Function to load comments ---
  async function loadComments() {
    const commentsList = document.getElementById("comments-list");
    commentsList.innerHTML = "<p>Memuat komentar...</p>";
    const commentsSnapshot = await db
      .collection("newsAndEvents")
      .doc(newsId)
      .collection("comments")
      .orderBy("createdAt", "desc")
      .get();

    if (commentsSnapshot.empty) {
      commentsList.innerHTML =
        '<p class="text-gray-500">Belum ada komentar. Jadilah yang pertama!</p>';
      return;
    }

    commentsList.innerHTML = ""; // Clear loading text
    commentsSnapshot.forEach((doc) => {
      const comment = doc.data();
      const commentDate = comment.createdAt
        .toDate()
        .toLocaleDateString("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric",
        });
      const commentElement = document.createElement("div");
      commentElement.className = "p-4 bg-gray-50 rounded-lg border";
      commentElement.innerHTML = `
        <div class="flex items-center mb-2">
            <p class="font-bold text-gray-800">${comment.name}</p>
            <span class="text-gray-400 text-sm ml-auto">${commentDate}</span>
        </div>
        <p class="text-gray-600 whitespace-pre-wrap">${comment.text}</p>
      `;
      commentsList.appendChild(commentElement);
    });
  }

  // --- Function to handle comment submission ---
  commentForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("comment-name").value.trim();
    const email = document.getElementById("comment-email").value.trim();
    const text = document.getElementById("comment-text").value.trim();

    if (!name || !email || !text) {
      alert("Harap isi semua kolom.");
      return;
    }

    const submitButton = commentForm.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = "Mengirim...";

    try {
      await db
        .collection("newsAndEvents")
        .doc(newsId)
        .collection("comments")
        .add({
          name: name,
          email: email,
          text: text,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        });
      commentForm.reset();
      alert("Komentar berhasil dikirim!");
      loadComments();
    } catch (error) {
      console.error("Error adding comment: ", error);
      alert("Gagal mengirim komentar.");
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "Kirim Komentar";
    }
  });

  // --- Load common page elements (Footer, Join Us Button) ---
  async function loadFooterAndJoinUs() {
    try {
      const mainContentDoc = await db
        .collection("siteContent")
        .doc("main")
        .get();
      if (mainContentDoc.exists) {
        const data = mainContentDoc.data();
        document
          .querySelectorAll(".join-us-button")
          .forEach((a) => (a.href = data.joinUsLink || "#"));

        const footerAddress = document.getElementById("footer-address-display");
        footerAddress.innerHTML = `<li>${data.footer?.address || ""}</li>`;

        const footerResearch = document.getElementById(
          "footer-research-display"
        );
        footerResearch.innerHTML = (data.footer?.research || [])
          .map(
            (item) =>
              `<li><a href="${item.url}" target="_blank" class="hover:text-secondary">${item.text}</a></li>`
          )
          .join("");

        const footerContact = document.getElementById("footer-contact-display");
        footerContact.innerHTML = (data.footer?.contact || [])
          .map(
            (item) =>
              `<li><a href="${item.url}" class="hover:text-secondary">${item.text}</a></li>`
          )
          .join("");
      }
    } catch (error) {
      console.error("Error loading footer data:", error);
    }
  }

  // --- Basic UI Logic ---
  mobileMenuButton.addEventListener("click", () =>
    mobileMenu.classList.toggle("hidden")
  );

  window.addEventListener("scroll", () => {
    goToTopButton.style.opacity = window.scrollY > 200 ? "1" : "0";
  });

  goToTopButton.addEventListener("click", () =>
    window.scrollTo({ top: 0, behavior: "smooth" })
  );

  // --- Initial Load ---
  loadNewsDetail();
});
