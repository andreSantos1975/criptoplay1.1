import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getSortedCourseData } from "@/lib/course";
import { HeroSection } from "@/components/learning-path/HeroSection";
import { ProgressBar } from "@/components/learning-path/ProgressBar";
import { ChapterGrid } from "@/components/learning-path/ChapterGrid";
import { ProBanner } from "@/components/learning-path/ProBanner";
import { allChapters, Chapter, ChapterStatus } from "@/components/learning-path/chaptersData";
import styles from "./page.module.css";
import Navbar from "@/components/Navbar/Navbar";
import { hasActiveSubscription } from "@/lib/permissions";

export const metadata: Metadata = {
  title: "Academia CriptoPlay | Aprenda do Zero ao Pro",
  description:
    "Domine o mercado de criptomoedas com a Academia CriptoPlay. Cursos estruturados, simuladores e mentoria para sua evolução financeira.",
  keywords: [
    "criptomoedas",
    "bitcoin",
    "blockchain",
    "investimento",
    "curso cripto",
    "educação financeira",
  ],
};

export default async function LearningPathPage() {
  const session = await getServerSession(authOptions);
  const hasAccess = hasActiveSubscription(session); // Use the new, stricter access check
  const isLoggedIn = !!session?.user;

  const courseData = getSortedCourseData();

  let completedSlugs: string[] = [];
  if (isLoggedIn && session.user) {
    const progress = await prisma.userProgress.findMany({
      where: { userId: session.user.id, completed: true },
      select: { slug: true },
    });
    completedSlugs = progress.map(p => p.slug);
  }

  const processedChapters: Chapter[] = allChapters.map((staticChapter) => {
    if (staticChapter.status === "coming") return staticChapter;

    const markdownData = courseData.find(c => c.order === staticChapter.id);
    const slug = markdownData?.slug;
    let status: ChapterStatus = "locked";

    if (slug) {
      const isCompleted = completedSlugs.includes(slug);
      if (hasAccess) {
        // Paid user has access to all chapters
        status = isCompleted ? "completed" : "available";
      } else {
        // Non-paid users (incl. trial) only get the first chapter
        status = staticChapter.id === 1 ? "available" : "locked";
      }
    }

    return {
      ...staticChapter,
      slug: slug,
      status: status,
    };
  });

  const completedCount = processedChapters.filter(c => c.status === "completed").length;
  const totalActiveChapters = processedChapters.filter(c => c.status !== "coming").length;
  
  // Find the next available lesson for the user to continue
  let nextLesson = processedChapters.find(c => c.status === 'available' && !completedSlugs.includes(c.slug || ''));
  if (!nextLesson) { // If all available are completed, find the first uncompleted one
      nextLesson = processedChapters.find(c => c.status !== 'completed' && c.status !== 'coming' && c.status !== 'locked');
  }
  const firstLesson = courseData.find(c => c.order === 1);
  const nextLessonSlug = nextLesson?.slug || firstLesson?.slug;

  return (
    <>
      <Navbar />
      <main className={styles.main}>
        <div style={{ marginTop: "64px" }}>
            <HeroSection isLoggedIn={isLoggedIn} nextLessonSlug={nextLessonSlug} />

            {isLoggedIn && (
              <ProgressBar
                completedChapters={completedCount}
                totalChapters={totalActiveChapters}
              />
            )}

            <ChapterGrid chapters={processedChapters} />

            {/* Show banner if the user does NOT have a paid subscription */}
            {!hasAccess && <ProBanner />}

            <footer className={styles.footer}>
              <div className={styles.container}>
                  <p className={styles.footerText}>
                  © 2024 CriptoPlay. Educação financeira de qualidade para todos.
                  </p>
              </div>
            </footer>
        </div>
      </main>
    </>
  );
}