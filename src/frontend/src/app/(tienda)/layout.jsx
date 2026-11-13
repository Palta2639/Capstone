import Navbar from '@/src/components/Navbar';
import Footer from '@/src/components/Footer';
import ChatbotSolar from '@/src/components/ChatbotSolar';

export default function ShopLayout({ children }) {
  return (
    <>
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <ChatbotSolar />
    </>
  );
}

