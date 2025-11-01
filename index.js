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

  // --- Initialize Firebase ---
  firebase.initializeApp(firebaseConfig);
  const db = firebase.firestore();

  // --- UI Logic (Menu, Scroll, etc.) ---
  const mobileMenuButton = document.getElementById("mobile-menu-button");
  const mobileMenu = document.getElementById("mobile-menu");
  const goToTopButton = document.getElementById("go-to-top");

  // --- ADDED: Function to populate mobile menu ---
  function setupMobileMenu() {
    const mobileMenuList = mobileMenu.querySelector("ul");
    const desktopNavLinks = document.querySelectorAll(
      "nav > .container > ul.hidden > li"
    );

    // Clear any existing items
    mobileMenuList.innerHTML = "";

    // Copy links from desktop to mobile
    desktopNavLinks.forEach((item) => {
      mobileMenuList.appendChild(item.cloneNode(true));
    });

    // Copy 'Join Us' button to mobile menu
    const joinUsButton = document
      .querySelector(".join-us-button")
      .cloneNode(true);
    const button = joinUsButton.querySelector("button");
    button.classList.remove("hidden"); // Make it visible on mobile
    button.classList.add("w-full", "mt-2"); // Make it full width for better UX
    const li = document.createElement("li");
    li.appendChild(joinUsButton);
    mobileMenuList.appendChild(li);
  }

  setupMobileMenu(); // Call the function to build the menu

  mobileMenuButton.addEventListener("click", () =>
    mobileMenu.classList.toggle("hidden")
  );

  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();
      const targetElement = document.querySelector(this.getAttribute("href"));
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: "smooth" });
      }
      // Hide mobile menu after clicking a link
      if (!mobileMenu.classList.contains("hidden")) {
        mobileMenu.classList.add("hidden");
      }
    });
  });

  window.addEventListener("scroll", () => {
    goToTopButton.style.opacity = window.scrollY > 200 ? "1" : "0";
    updateActiveNavLink();
  });

  goToTopButton.addEventListener("click", () =>
    window.scrollTo({ top: 0, behavior: "smooth" })
  );

  function updateActiveNavLink() {
    let current = "";
    document.querySelectorAll("section").forEach((section) => {
      const sectionTop = section.offsetTop;
      if (window.scrollY >= sectionTop - 60) {
        current = "#" + section.getAttribute("id");
      }
    });
    document.querySelectorAll(".nav-link").forEach((link) => {
      link.classList.toggle("active", link.getAttribute("href") === current);
      link.classList.toggle(
        "text-primary",
        link.getAttribute("href") === current
      );
    });
  }

  // --- Firestore Data Loading ---
  async function loadPublicData() {
    try {
      // Load Main Content (Hero, Stats, Footer, Join Us)
      const mainContentDoc = await db
        .collection("siteContent")
        .doc("main")
        .get();
      if (mainContentDoc.exists) {
        const data = mainContentDoc.data();
        document.getElementById("hero-title-display").innerHTML =
          data.heroTitle || "";
        document.getElementById("hero-description-display").textContent =
          data.heroDescription || "";
        document.getElementById("stat-partners-display").textContent =
          data.stats?.partners || "0";
        document.getElementById("stat-projects-display").textContent =
          data.stats?.projects || "0";
        document.getElementById("stat-increase-display").textContent =
          data.stats?.increase || "0";
        document.getElementById("stat-members-display").textContent =
          data.stats?.members || "0";

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

      // Load Research Interests
      const researchContainer = document.getElementById(
        "research-interest-container"
      );
      const researchSnapshot = await db
        .collection("researchInterests")
        .orderBy("createdAt")
        .get();
      researchContainer.innerHTML = "";
      researchSnapshot.forEach((doc) => {
        const item = doc.data();
        researchContainer.innerHTML += `
                    <div class="bg-[#2e686c] p-8 rounded-2xl transition-all hover-lift">
                        <i class="${item.iconLink} text-3xl"></i>
                        <h5 class="font-medium text-lg mb-2 mt-10">${item.title}</h5>
                    </div>`;
      });

      // Load News & Events
      const newsContainer = document.getElementById("news-container");
      const newsSnapshot = await db
        .collection("newsAndEvents")
        .orderBy("createdAt", "desc")
        .get();
      newsContainer.innerHTML = "";
      newsSnapshot.forEach((doc) => {
        const item = doc.data();
        const newsId = doc.id;
        newsContainer.innerHTML += `
                    <a href="news-detail.html?id=${newsId}" class="block rounded-2xl bg-white py-6 px-8 shadow-md transition-all hover-lift">
                        <h2 class="font-bold text-xl mb-4">${item.title}</h2>
                        <div class="relative w-full aspect-square">
                            <img src="${item.image}" alt="${item.title}" class="absolute inset-0 object-cover w-full h-full rounded-xl"/>
                        </div>
                        <p class="text-gray-600 font-medium text-justify mt-4 leading-loose h-32 overflow-hidden">${item.summary}</p>
                        <small class="text-gray-500 text-end mt-4 block">${item.date}</small>
                    </a>`;
      });

      // Load Team Members
      const teamContainer = document.getElementById("team-container");
      const mentorsSnapshot = await db
        .collection("teamMembers")
        .where("role", "==", "Mentor")
        .orderBy("name")
        .get();
      const membersSnapshot = await db
        .collection("teamMembers")
        .where("role", "==", "Member")
        .orderBy("name")
        .get();
      teamContainer.innerHTML = "";
      mentorsSnapshot.forEach((doc) => {
        const item = doc.data();
        teamContainer.innerHTML += `
                    <div class="col-span-1 md:col-span-3 lg:col-span-5 relative h-[360px] aspect-[3/4] w-fit mx-auto bg-[#1f2326] rounded-2xl shadow-md transition-all hover-lift">
                        <img src="${item.image}" alt="${item.name}" class="object-cover w-full h-full rounded-2xl"/>
                        <div class="absolute bottom-0 left-0 text-white p-3 w-full bg-gradient-to-t from-black via-black/70 to-transparent rounded-b-2xl">
                            <p class="font-bold">${item.name}</p>
                            <p class="text-sm text-gray-400">${item.role}</p>
                        </div>
                    </div>`;
      });
      membersSnapshot.forEach((doc) => {
        const item = doc.data();
        teamContainer.innerHTML += `
                    <div class="relative h-[276px] aspect-[3/4] bg-[#1f2326] rounded-2xl mx-auto shadow-md transition-all hover-lift">
                        <img src="${item.image}" alt="${item.name}" class="object-cover w-full h-full rounded-2xl"/>
                        <div class="absolute bottom-0 left-0 text-white p-3 w-full bg-gradient-to-t from-black via-black/70 to-transparent rounded-b-2xl">
                            <p class="font-bold">${item.name}</p>
                            <p class="text-sm text-gray-400">${item.role}</p>
                        </div>
                    </div>`;
      });

      // Load Projects and initialize slider
      const projectsSnapshot = await db
        .collection("projects")
        .orderBy("createdAt")
        .get();
      const projects = [];
      projectsSnapshot.forEach((doc) => projects.push(doc.data()));
      if (projects.length > 0) {
        initializeProjectSlider(projects);
      }
    } catch (error) {
      console.error("Error loading public data:", error);
    }
  }

  // Fungsi slider project diperbarui untuk mengatasi auto-scroll
  function initializeProjectSlider(projects) {
    let currentProjectIndex = 0;
    const projectContainer = document.getElementById("project-container");
    const dotsContainer = document.getElementById("dots-container");

    // Fungsi baru untuk menggulir dot
    function scrollActiveDotIntoView() {
      const activeDot = document.getElementById(`dot-${currentProjectIndex}`);
      if (activeDot) {
        activeDot.scrollIntoView({
          behavior: "smooth",
          inline: "center",
          block: "nearest",
        });
      }
    }

    function renderProject(index) {
      const project = projects[index];
      let projectLinkHTML = "";
      if (project.link) {
        projectLinkHTML = `
          <a href="${project.link}" target="_blank" class="inline-block mt-6 bg-primary text-white rounded-full px-6 py-3 font-semibold shadow-md hover:bg-primary/90 transition-colors">
            Lihat Detail Proyek
          </a>`;
      }

      projectContainer.innerHTML = `
                <div>
                    <div class="flex items-center justify-center bg-gray-200 aspect-square rounded-2xl shadow-md transition-all hover-lift">
                        <img src="${project.images[0]}" alt="${
        project.title
      }" width="320" height="320" id="project-main-image" class="w-full h-full object-contain rounded-2xl p-4"/>
                    </div>
                    <div class="overflow-x-auto whitespace-nowrap scroll-smooth mt-3" id="thumbnails-container">
                        ${project.images
                          .map(
                            (imgSrc, i) => `
                            <div class="inline-block relative aspect-square w-24 h-24 shrink-0 cursor-pointer transition-all hover-lift p-1">
                                <img src="${imgSrc}" alt="thumbnail" class="w-full h-full object-cover rounded thumbnail ${
                              i === 0 ? "ring-2 ring-primary" : ""
                            }" data-img-src="${imgSrc}"/>
                            </div>
                        `
                          )
                          .join("")}
                    </div>
                </div>
                <div>
                    <div class="mb-4">
                        <h2 class="text-2xl md:text-3xl font-bold tracking-wider">${
                          project.title
                        }</h2>
                    </div>
                    <p class="tracking-wide text-justify font-medium text-gray-600">${
                      project.description
                    }</p>
                    ${projectLinkHTML}
                </div>`;

      // Add event listeners to thumbnails
      projectContainer.querySelectorAll(".thumbnail").forEach((thumb) => {
        thumb.addEventListener("click", () => {
          document.getElementById("project-main-image").src =
            thumb.dataset.imgSrc;
          projectContainer
            .querySelectorAll(".thumbnail")
            .forEach((t) => t.classList.remove("ring-2", "ring-primary"));
          thumb.classList.add("ring-2", "ring-primary");
        });
      });

      // Render dots
      dotsContainer.innerHTML = projects
        .map(
          (_, i) =>
            `<div id="dot-${i}" class="h-3 w-3 rounded-full flex-shrink-0 transition-colors ${
              i === index ? "bg-primary" : "bg-gray-300"
            }"></div>`
        )
        .join("");
    }

    document.getElementById("prev-project").addEventListener("click", () => {
      currentProjectIndex =
        (currentProjectIndex - 1 + projects.length) % projects.length;
      renderProject(currentProjectIndex);
      // Panggil fungsi scroll HANYA saat tombol diklik
      scrollActiveDotIntoView();
    });

    document.getElementById("next-project").addEventListener("click", () => {
      currentProjectIndex = (currentProjectIndex + 1) % projects.length;
      renderProject(currentProjectIndex);
      // Panggil fungsi scroll HANYA saat tombol diklik
      scrollActiveDotIntoView();
    });

    // Render proyek pertama kali tanpa memanggil fungsi scroll
    renderProject(0);
  }

  // --- Initial Load ---
  loadPublicData();
});
