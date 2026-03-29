import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import Services from '../components/Services';
import AboutUs from '../components/AboutUs';
import Providers from '../components/Providers';
import Reviews from '../components/Reviews';
import Support from '../components/Support';
import Footer from '../components/Footer';

function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-[#0F172A] text-white">
      {/* Global gradient background */}
      <div className="fixed inset-0 bg-gradient-to-br from-[#22C55E]/10 via-transparent to-[#4ADE80]/5 pointer-events-none z-0" />
      <div className="fixed bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-[#22C55E]/15 to-transparent pointer-events-none z-0" />

      <Navbar />
      <Hero />
      <Services />
      <AboutUs />
      <Providers />
      <Reviews />
      <Support />
      <Footer />
    </div>
  );
}

export default Home;
