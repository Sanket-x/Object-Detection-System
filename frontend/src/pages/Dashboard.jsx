import VideoFeed from '../components/VideoFeed';
import Sidebar   from '../components/Sidebar';

export default function Dashboard() {
  return (
    <main className="flex-1 pt-20 pb-8 px-4 sm:px-6 lg:px-8 max-w-[1440px] mx-auto w-full">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Video — takes most space */}
        <div className="flex-1">
          <VideoFeed />
        </div>

        {/* Sidebar */}
        <div className="w-full lg:w-[300px] shrink-0">
          <Sidebar />
        </div>
      </div>
    </main>
  );
}
