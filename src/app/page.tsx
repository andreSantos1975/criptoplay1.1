import Header from "@/components/Navbar/Navbar";
import Hero from "@/components/Hero/Hero";
// import HowItWorks from "@/components/HowItWorks";
// import Features from "@/components/Features";
// import Testimonials from "@/components/Testimonials";
// import Footer from "@/components/Footer";

import styles from "./page.module.css";

const Index = () => {
  return (
    <div className={styles.mainContainer}>
      <Header />
      <main>
        <Hero />
        {/* <HowItWorks />
        <Features />
        <Testimonials /> */}
      </main>
      {/* <Footer /> */}
    </div>
  );
};

export default Index;