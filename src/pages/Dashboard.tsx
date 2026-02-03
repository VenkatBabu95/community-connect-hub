import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import ChatRoom from '@/components/chat/ChatRoom';
import StudentDirectory from '@/components/directory/StudentDirectory';
import { LogOut, Settings, GraduationCap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <GraduationCap className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="font-semibold">College Community</h1>
            <p className="text-sm text-muted-foreground">
              Welcome, {user?.displayName || user?.username}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/admin')}
            >
              <Settings className="mr-2 h-4 w-4" />
              Admin
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Chat Area */}
        <div className="flex-1 overflow-hidden">
          <ChatRoom />
        </div>

        {/* Student Directory Sidebar */}
        <div className="hidden w-72 border-l lg:block">
          <StudentDirectory />
        </div>
      </div>
    </div>
  );
}
