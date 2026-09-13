import Header from "../components/Header/Header";
import Footer from "../components/Footer/Footer";
import CookieBanner from "../components/CookieBanner";
import { Link } from "react-router-dom";

export default function MainLayout({ children }) {
  return (
    <>
      <Header />
      <main className="main-content">
        <div className="page-container">
          {children}
        </div>
      </main>
      <div className="faq-link-section">
        <Link to="/faq" className="faq-link">Часто задаваемые вопросы (FAQ)</Link>
      </div>
      <Footer />
      <CookieBanner />
    </>
  );
}
