"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { db, convertGoogleDriveLink } from "@/lib/firebase";
import { collection, doc, getDoc, getDocs, orderBy, query, where } from "firebase/firestore";
import { recordVisit } from "@/lib/analytics";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import GoToTop from "@/components/GoToTop";
import type { SiteContent, ResearchInterest, NewsItem, ProjectItem, TeamMember } from "@/types";

export default function HomePage() {
  const [siteContent, setSiteContent] = useState<SiteContent>({});
  const [researchInterests, setResearchInterests] = useState<ResearchInterest[]>([]);
  const [newsList, setNewsList] = useState<NewsItem[]>([]);
  const [mentors, setMentors] = useState<TeamMember[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [currentProjectIndex, setCurrentProjectIndex] = useState(0);
  const [activeThumbIndex, setActiveThumbIndex] = useState(0);

  const dotsContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Record page visit for analytics
    recordVisit();

    async function loadPublicData() {
      try {
        // Main content
        const mainDocRef = doc(db, "siteContent", "main");
        const mainSnap = await getDoc(mainDocRef);
        if (mainSnap.exists()) {
          setSiteContent(mainSnap.data() as SiteContent);
        }

        // Research interests (Newest first)
        try {
          let resSnap;
          try {
            const resQ = query(collection(db, "researchInterests"), orderBy("createdAt", "desc"));
            resSnap = await getDocs(resQ);
          } catch {
            resSnap = await getDocs(collection(db, "researchInterests"));
          }
          const resList: ResearchInterest[] = [];
          resSnap.forEach((d) => {
            resList.push({ id: d.id, ...(d.data() as Omit<ResearchInterest, "id">) });
          });
          setResearchInterests(resList);
        } catch (e) {
          console.error("Error fetching research interests:", e);
        }

        // News & events (Newest first)
        try {
          const newsQ = query(collection(db, "newsAndEvents"), orderBy("createdAt", "desc"));
          const newsSnap = await getDocs(newsQ);
          const nList: NewsItem[] = [];
          newsSnap.forEach((d) => {
            nList.push({ id: d.id, ...(d.data() as Omit<NewsItem, "id">) });
          });
          setNewsList(nList);
        } catch (e) {
          console.error("Error fetching news:", e);
        }

        // Mentors (Newest first)
        try {
          let mentorSnap;
          try {
            const mentorQ = query(
              collection(db, "teamMembers"),
              where("role", "==", "Mentor"),
              orderBy("createdAt", "desc")
            );
            mentorSnap = await getDocs(mentorQ);
          } catch {
            const mentorQ = query(
              collection(db, "teamMembers"),
              where("role", "==", "Mentor"),
              orderBy("name")
            );
            mentorSnap = await getDocs(mentorQ);
          }
          const mList: TeamMember[] = [];
          mentorSnap.forEach((d) => {
            mList.push({ id: d.id, ...(d.data() as Omit<TeamMember, "id">) });
          });
          setMentors(mList);
        } catch (e) {
          console.error("Error fetching mentors:", e);
        }

        // Members (Newest first)
        try {
          let memberSnap;
          try {
            const memberQ = query(
              collection(db, "teamMembers"),
              where("role", "==", "Member"),
              orderBy("createdAt", "desc")
            );
            memberSnap = await getDocs(memberQ);
          } catch {
            const memberQ = query(
              collection(db, "teamMembers"),
              where("role", "==", "Member"),
              orderBy("name")
            );
            memberSnap = await getDocs(memberQ);
          }
          const mbList: TeamMember[] = [];
          memberSnap.forEach((d) => {
            mbList.push({ id: d.id, ...(d.data() as Omit<TeamMember, "id">) });
          });
          setMembers(mbList);
        } catch (e) {
          console.error("Error fetching members:", e);
        }

        // Projects (Newest first)
        try {
          let projSnap;
          try {
            const projQ = query(collection(db, "projects"), orderBy("createdAt", "desc"));
            projSnap = await getDocs(projQ);
          } catch {
            projSnap = await getDocs(collection(db, "projects"));
          }
          const pList: ProjectItem[] = [];
          projSnap.forEach((d) => {
            pList.push({ id: d.id, ...(d.data() as Omit<ProjectItem, "id">) });
          });
          setProjects(pList);
        } catch (e) {
          console.error("Error fetching projects:", e);
        }
      } catch (error) {
        console.error("Error loading public data:", error);
      }
    }

    loadPublicData();
  }, []);

  // When project changes, reset active thumbnail and scroll dot
  useEffect(() => {
    setActiveThumbIndex(0);
    if (dotsContainerRef.current) {
      const activeDot = dotsContainerRef.current.querySelector(`#dot-${currentProjectIndex}`);
      if (activeDot) {
        activeDot.scrollIntoView({
          behavior: "smooth",
          inline: "center",
          block: "nearest",
        });
      }
    }
  }, [currentProjectIndex]);

  const currentProject = projects[currentProjectIndex];

  const handlePrevProject = () => {
    if (projects.length === 0) return;
    setCurrentProjectIndex((prev) => (prev - 1 + projects.length) % projects.length);
  };

  const handleNextProject = () => {
    if (projects.length === 0) return;
    setCurrentProjectIndex((prev) => (prev + 1) % projects.length);
  };

  // Fallback defaults for custom fields with Google Drive conversion
  const heroLeftImage = convertGoogleDriveLink(siteContent.heroLeftImage || "/assets/img/panyileukan2.jpg");
  const heroRightImage = convertGoogleDriveLink(siteContent.heroRightImage || "/assets/img/hidroponik.jpg");
  const heroRightText = siteContent.heroRightText || "Achieve optimal efficiency and boost productivity!";

  const aboutTitle = siteContent.aboutTitle || "Smart Grow Lab";
  const aboutParagraph1 =
    siteContent.aboutParagraph1 ||
    "SMART GROW LAB is an integrated research and innovation hub focused on developing intelligent, sustainable, and data-driven agricultural systems. By leveraging cutting-edge technologies such as the Internet of Things (IoT), Artificial Intelligence (AI), and automation, SMART GROW LAB aims to revolutionize traditional farming practices and address global challenges related to food security, climate change, and resource efficiency.";
  const aboutParagraph2 =
    siteContent.aboutParagraph2 ||
    "Our core activities include the design and implementation of smart farming solutions—ranging from hydroponics and aquaponics to smart greenhouses and AIoT-based aquaculture monitoring systems. Through multidisciplinary collaboration and a commitment to sustainable development, SMART GROW LAB supports the transformation of agriculture into a high-tech, environmentally responsible sector.";

  return (
    <>
      <Navbar isHomePage={true} joinUsLink={siteContent.joinUsLink} />

      <main>
        {/* HERO SECTION */}
        <section
          id="hero"
          className="py-20 container mx-auto min-h-screen flex items-center justify-center px-4"
        >
          <div className="w-full">
            <div className="text-center mb-5 animate-fade-in-up">
              <h1
                id="hero-title-display"
                className="text-3xl md:text-5xl font-extrabold leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html: siteContent.heroTitle || "",
                }}
              />
              <p
                id="hero-description-display"
                className="mt-3 text-sm md:text-lg text-gray-500 font-semibold"
              >
                {siteContent.heroDescription || ""}
              </p>
              <a
                href="#fitur-kami"
                className="inline-block bg-primary text-white rounded-full px-8 py-4 md:py-6 mt-8 mb-4 text-sm md:text-base shadow-md hover:bg-primary/90 transition-all duration-300 transform hover:scale-105 active:scale-95"
              >
                See More
              </a>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mx-auto animate-bounce mt-2 text-primary"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-9 gap-8 items-end mt-8 animate-fade-in-up delay-100">
              {/* Pojok Kiri Hero Card (Customizable image) */}
              <div className="md:col-span-2 bg-white h-80 relative rounded-2xl overflow-hidden transition-all hover-lift shadow-sm">
                <img
                  src={heroLeftImage}
                  alt="Hero left showcase"
                  className="w-full h-full object-cover object-center rounded-2xl transition-transform duration-500 hover:scale-105"
                />
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-10 md:col-span-5 gap-8 items-end">
                <div className="flex flex-col justify-center md:col-span-3 bg-primary text-center px-3 rounded-2xl h-60 text-white transition-all hover-lift shadow-md">
                  <h5 id="stat-partners-display" className="text-3xl font-bold mb-2">
                    {siteContent.stats?.partners || "0"}
                  </h5>
                  <p className="font-medium text-white/90 text-sm leading-relaxed">
                    Our Partners
                    <br />
                    and Clients
                    <br />
                    Collaborate
                  </p>
                </div>
                <div className="md:col-span-4 bg-white p-8 rounded-2xl shadow-md transition-all hover-lift">
                  <p className="text-sm leading-relaxed font-semibold text-gray-800">
                    Total project
                  </p>
                  <h5 id="stat-projects-display" className="text-3xl font-bold mt-1 mb-2">
                    {siteContent.stats?.projects || "0"}
                  </h5>
                  <p className="text-sm leading-relaxed text-gray-500">
                    Increased{" "}
                    <span id="stat-increase-display" className="text-green-500 font-bold">
                      {siteContent.stats?.increase ?? "0"}
                    </span>{" "}
                    this month
                  </p>
                </div>
                <div className="flex flex-col justify-center md:col-span-3 bg-secondary text-center px-3 rounded-2xl h-60 text-gray-800 shadow-md transition-all hover-lift">
                  <h5 id="stat-members-display" className="text-3xl font-bold mb-2">
                    {siteContent.stats?.members || "0"}
                  </h5>
                  <p className="text-sm font-medium leading-relaxed">
                    Laboratory Members
                  </p>
                </div>
              </div>

              {/* Pojok Kanan Hero Card (Customizable image & text) */}
              <div className="md:col-span-2 bg-primary p-8 rounded-2xl flex flex-col gap-4 h-80 justify-end relative overflow-hidden text-white shadow-md transition-all hover-lift">
                <img
                  src={heroRightImage}
                  alt="Productivity"
                  className="absolute top-0 left-0 w-full h-full object-cover object-center rounded-2xl opacity-35 transition-transform duration-500 hover:scale-105"
                />
                <p className="font-medium relative z-10 leading-relaxed">
                  {heroRightText}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FITUR KAMI / RESEARCH INTEREST */}
        <section id="fitur-kami" className="bg-primary">
          <div className="container mx-auto py-20 text-white px-4">
            <h1 className="text-center text-3xl md:text-4xl font-bold mb-4 animate-fade-in-up">
              Research Interest
            </h1>
            <div
              id="research-interest-container"
              className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-16"
            >
              {researchInterests.map((item, idx) => (
                <div
                  key={item.id}
                  className="bg-[#2e686c] p-8 rounded-2xl transition-all hover-lift flex flex-col justify-between"
                  style={{ animationDelay: `${idx * 80}ms` }}
                >
                  <i className={`${item.iconLink} text-3xl text-white/90`}></i>
                  <h5 className="font-medium text-lg mb-2 mt-10">{item.title}</h5>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* BERITA & KEGIATAN / NEWS & EVENTS */}
        <section id="berita-kegiatan">
          <div className="container mx-auto pt-20 px-4">
            <h1 className="text-3xl md:text-4xl font-bold leading-relaxed mb-12 animate-fade-in-up">
              News & Events
            </h1>
            <div id="news-container" className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {newsList.map((item, idx) => (
                <Link
                  key={item.id}
                  href={`/news-detail?id=${item.id}`}
                  className="block rounded-2xl bg-white py-6 px-8 shadow-md transition-all hover-lift group"
                  style={{ animationDelay: `${idx * 80}ms` }}
                >
                  <h2 className="font-bold text-xl mb-4 group-hover:text-primary transition-colors">
                    {item.title}
                  </h2>
                  <div className="relative w-full aspect-square overflow-hidden rounded-xl bg-gray-100">
                    <img
                      src={convertGoogleDriveLink(item.image)}
                      alt={item.title}
                      className="absolute inset-0 object-cover w-full h-full rounded-xl transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <p className="text-gray-600 font-medium text-justify mt-4 leading-loose h-32 overflow-hidden">
                    {item.summary}
                  </p>
                  <small className="text-gray-500 text-end mt-4 block">{item.date}</small>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* WAVE DIVIDER */}
        <div className="leading-none -mb-1">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320">
            <path
              fill="var(--bg-light, #ffffff)"
              fillOpacity="1"
              d="M0,288L48,272C96,256,192,224,288,197.3C384,171,480,149,576,165.3C672,181,768,235,864,250.7C960,267,1056,245,1152,250.7C1248,256,1344,288,1392,304L1440,320L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
            />
          </svg>
        </div>

        {/* PROJECTS */}
        <section id="proyek" className="pb-32 bg-[var(--bg-light,#ffffff)] transition-colors duration-300">
          <div className="max-w-5xl mx-auto px-4">
            <h1 className="uppercase text-primary tracking-widest font-bold text-2xl mb-16">
              Project
            </h1>

            {currentProject && (
              <div id="project-container" className="grid grid-cols-1 md:grid-cols-2 mt-16 gap-12 items-center">
                <div>
                  <div className="flex items-center justify-center bg-gray-100 aspect-square rounded-2xl shadow-md transition-all hover-lift overflow-hidden">
                    <img
                      src={convertGoogleDriveLink(
                        currentProject.images && currentProject.images[activeThumbIndex]
                          ? currentProject.images[activeThumbIndex]
                          : currentProject.images?.[0] || ""
                      )}
                      alt={currentProject.title}
                      width={320}
                      height={320}
                      id="project-main-image"
                      className="w-full h-full object-contain rounded-2xl p-4 transition-all duration-300"
                    />
                  </div>
                  <div
                    className="overflow-x-auto whitespace-nowrap scroll-smooth mt-3 py-1"
                    id="thumbnails-container"
                  >
                    {currentProject.images?.map((imgSrc, i) => (
                      <div
                        key={i}
                        onClick={() => setActiveThumbIndex(i)}
                        className="inline-block relative aspect-square w-24 h-24 shrink-0 cursor-pointer transition-all hover-lift p-1"
                      >
                        <img
                          src={convertGoogleDriveLink(imgSrc)}
                          alt="thumbnail"
                          className={`w-full h-full object-cover rounded thumbnail transition-all ${
                            i === activeThumbIndex ? "ring-2 ring-primary scale-105" : "opacity-75 hover:opacity-100"
                          }`}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="mb-4">
                    <h2 className="text-2xl md:text-3xl font-bold tracking-wider">
                      {currentProject.title}
                    </h2>
                  </div>
                  <p className="tracking-wide text-justify font-medium text-gray-600 leading-relaxed">
                    {currentProject.description}
                  </p>
                  {currentProject.link ? (
                    <a
                      href={currentProject.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block mt-6 bg-primary text-white rounded-full px-6 py-3 font-semibold shadow-md hover:bg-primary/90 transition-all duration-300 transform hover:scale-105 active:scale-95"
                    >
                      Lihat Detail Proyek
                    </a>
                  ) : null}
                </div>
              </div>
            )}

            {projects.length > 0 && (
              <div className="flex items-center justify-between mt-8">
                <div
                  id="dots-container"
                  ref={dotsContainerRef}
                  className="flex items-center gap-3 overflow-x-auto scroll-smooth py-2"
                >
                  {projects.map((_, i) => (
                    <div
                      key={i}
                      id={`dot-${i}`}
                      onClick={() => setCurrentProjectIndex(i)}
                      className={`h-3 w-3 rounded-full flex-shrink-0 transition-all duration-300 cursor-pointer ${
                        i === currentProjectIndex ? "bg-primary scale-125" : "bg-gray-300 hover:bg-gray-400"
                      }`}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-4">
                  <button
                    id="prev-project"
                    onClick={handlePrevProject}
                    aria-label="Previous project"
                    className="flex items-center justify-center bg-gray-200 rounded-full p-2 text-gray-600 hover:bg-primary hover:text-white transition-all duration-300 cursor-pointer transform hover:scale-110 active:scale-95"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m15 18-6-6 6-6" />
                    </svg>
                  </button>
                  <button
                    id="next-project"
                    onClick={handleNextProject}
                    aria-label="Next project"
                    className="flex items-center justify-center bg-primary rounded-full p-2 text-white hover:bg-primary/80 transition-all duration-300 cursor-pointer transform hover:scale-110 active:scale-95"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* TENTANG KAMI / OUR TEAM */}
        <section id="tentang-kami" className="bg-linear-to-t">
          <div className="container mx-auto pt-32 pb-16 px-4">
            <h1 className="text-center text-3xl font-bold text-white">Our Team</h1>
            <hr className="w-10 mx-auto mt-4 border-t-2 border-primary rounded-full" />
            <div
              id="team-container"
              className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-8 py-16 justify-center items-start"
            >
              {mentors.map((item) => (
                <div
                  key={item.id}
                  className="col-span-1 md:col-span-3 lg:col-span-5 relative h-[360px] aspect-[3/4] w-fit mx-auto bg-[#1f2326] rounded-2xl shadow-md transition-all hover-lift overflow-hidden group"
                >
                  <img
                    src={convertGoogleDriveLink(item.image)}
                    alt={item.name}
                    className="object-cover w-full h-full rounded-2xl transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute bottom-0 left-0 text-white p-3 w-full bg-gradient-to-t from-black via-black/70 to-transparent rounded-b-2xl">
                    <p className="font-bold">{item.name}</p>
                    <p className="text-sm text-gray-400">{item.role}</p>
                  </div>
                </div>
              ))}
              {members.map((item) => (
                <div
                  key={item.id}
                  className="relative h-[276px] aspect-[3/4] bg-[#1f2326] rounded-2xl mx-auto shadow-md transition-all hover-lift overflow-hidden group"
                >
                  <img
                    src={convertGoogleDriveLink(item.image)}
                    alt={item.name}
                    className="object-cover w-full h-full rounded-2xl transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute bottom-0 left-0 text-white p-3 w-full bg-gradient-to-t from-black via-black/70 to-transparent rounded-b-2xl">
                    <p className="font-bold">{item.name}</p>
                    <p className="text-sm text-gray-400">{item.role}</p>
                  </div>
                </div>
              ))}
            </div>
            <hr className="border-none bg-gray-500 h-[1px] my-16" />

            {/* Smart Grow Lab Customizable Text Section */}
            <div className="text-center max-w-4xl mx-auto">
              <h1 className="text-3xl font-bold text-white mb-6">{aboutTitle}</h1>
              <p className="text-gray-400 leading-relaxed text-justify md:text-center mb-6">
                {aboutParagraph1}
              </p>
              <p className="text-gray-400 leading-relaxed text-justify md:text-center mb-8">
                {aboutParagraph2}
              </p>
              <a
                href={siteContent.joinUsLink || "#"}
                target={siteContent.joinUsLink && siteContent.joinUsLink !== "#" ? "_blank" : undefined}
                rel={siteContent.joinUsLink && siteContent.joinUsLink !== "#" ? "noopener noreferrer" : undefined}
                className="join-us-button inline-block"
              >
                <button className="bg-primary text-white rounded-full px-10 py-6 font-semibold text-base shadow-lg shadow-primary/50 hover:bg-primary/90 transition-all duration-300 transform hover:scale-105 active:scale-95 cursor-pointer">
                  Join Us!
                </button>
              </a>
            </div>
            <hr className="border-none bg-gray-500 h-[1px] mt-16" />
          </div>
        </section>
      </main>

      <Footer footerData={siteContent.footer} />
      <GoToTop />
    </>
  );
}
