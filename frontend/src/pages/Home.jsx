import Hero from '../components/Hero';

export default function Home() {
  return (
    <div className="relative w-full min-h-screen flex flex-col items-center justify-center">
      
      {/* Background abstract elements to add to the fintech style */}
      <div className="absolute top-0 w-full h-[600px] overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[20%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px]" />
        <div className="absolute top-[10%] right-[10%] w-[400px] h-[400px] bg-cyan-600/10 rounded-full blur-[100px]" />
      </div>

      <main className="w-full container mx-auto px-6 relative z-10 flex flex-col items-center justify-center">
        <Hero />
      </main>
    </div>
  );
}
