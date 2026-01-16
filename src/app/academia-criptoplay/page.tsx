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
  const isLoggedIn = !!session?.user;
  const isPro = session?.user?.subscriptionStatus === "active"; // Ajustar conforme lógica real de subscription

  // 1. Get real course data (slugs and order)
  const courseData = getSortedCourseData(); // Returns [{ slug, title, order, ... }]

  // 2. Get user progress
  let completedSlugs: string[] = [];
  if (isLoggedIn && session.user) {
    const progress = await prisma.userProgress.findMany({
      where: {
        userId: session.user.id,
        completed: true,
      },
      select: { slug: true },
    });
    completedSlugs = progress.map(p => p.slug);
  }

  // 3. Merge data and calculate status
  let firstAvailableFound = false;

  const processedChapters: Chapter[] = allChapters.map((staticChapter) => {
    // Se for "coming", mantém como está
    if (staticChapter.status === "coming") return staticChapter;

    // Encontra o markdown correspondente pelo ID/Order
    const markdownData = courseData.find(c => c.order === staticChapter.id);
    const slug = markdownData?.slug;

    let status: ChapterStatus = "locked";

    if (slug) {
      if (completedSlugs.includes(slug)) {
        status = "completed";
      } else if (!firstAvailableFound) {
        // Se ainda não achamos o primeiro disponível, este é o "próximo"
        // Lógica simplificada: Se o anterior foi completado (ou é o primeiro), e este não, então é available.
        // Como estamos iterando em ordem, o primeiro que não for "completed" vira "available".
        status = "available";
        firstAvailableFound = true;
      } else {
        status = "locked";
      }
    } else {
      // Se não achou markdown mas não é coming, algo está errado na configuração, trava.
      status = "locked"; 
    }

    // Se não estiver logado, apenas o primeiro é available (como demo) ou tudo locked?
    // Vamos deixar o primeiro available para teaser.
    if (!isLoggedIn) {
        if (staticChapter.id === 1) status = "available";
        else status = "locked";
    }

    return {
      ...staticChapter,
      slug: slug,
      status: status,
    };
  });

  const completedCount = processedChapters.filter(c => c.status === "completed").length;
  // Apenas conta chapters que realmente existem (não "coming") para o total
  const totalActiveChapters = processedChapters.filter(c => c.status !== "coming").length;

  const nextLesson = processedChapters.find(c => c.status === 'available');
  // Fallback to the very first lesson if none are "available" (e.g., all completed)
  const firstLesson = courseData.find(c => c.order === 1);
  const nextLessonSlug = nextLesson?.slug || firstLesson?.slug;

  return (
    <>
      <Navbar />
      <main className={styles.main}>
        <div style={{ marginTop: "64px" }}>
            {/* Hero Section */}
            <HeroSection isLoggedIn={isLoggedIn} nextLessonSlug={nextLessonSlug} />

            {/* Progress Bar - only show when logged in */}
            {isLoggedIn && (
            <ProgressBar
                completedChapters={completedCount}
                totalChapters={totalActiveChapters}
            />
            )}

            {/* Chapter Grid */}
            <ChapterGrid chapters={processedChapters} />

            {/* Pro Banner - only show when not PRO */}
            {!isPro && <ProBanner />}

            {/* Footer */}
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