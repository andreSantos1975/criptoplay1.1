import { Metadata } from "next";
import { HeroSection } from "@/components/learning-path/HeroSection";
import { ProgressBar } from "@/components/learning-path/ProgressBar";
import { ChapterGrid } from "@/components/learning-path/ChapterGrid";
import { ProBanner } from "@/components/learning-path/ProBanner";
import { allChapters } from "@/components/learning-path/chaptersData";
import styles from "./page.module.css";

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

// Simulated user state - in production this would come from auth/API
const isLoggedIn = true;
const isPro = false;
const completedChapters = 2;
const totalActiveChapters = allChapters.filter((c) => c.status !== "coming").length;

export default function LearningPathPage() {
  return (
    <main className={styles.main}>
      {/* Hero Section */}
      <HeroSection isLoggedIn={isLoggedIn} />

      {/* Progress Bar - only show when logged in */}
      {isLoggedIn && (
        <ProgressBar
          completedChapters={completedChapters}
          totalChapters={totalActiveChapters}
        />
      )}

      {/* Chapter Grid */}
      <ChapterGrid chapters={allChapters} />

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
    </main>
  );
}
