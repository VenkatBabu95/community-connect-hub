import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Search, Users } from 'lucide-react';

interface Student {
  id: string;
  user_id: string;
  username: string;
  display_name: string | null;
  is_online: boolean;
  last_seen: string;
}

export default function StudentDirectory() {
  const [students, setStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStudents();

    // Subscribe to profile changes for online status
    const channel = supabase
      .channel('profiles')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
        },
        (payload) => {
          setStudents((prev) =>
            prev.map((student) =>
              student.id === payload.new.id
                ? { ...student, ...payload.new }
                : student
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchStudents = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('is_online', { ascending: false })
      .order('username', { ascending: true });

    if (!error && data) {
      setStudents(data);
    }
    setIsLoading(false);
  };

  const filteredStudents = students.filter((student) => {
    const query = searchQuery.toLowerCase();
    return (
      student.username.toLowerCase().includes(query) ||
      (student.display_name?.toLowerCase().includes(query) ?? false)
    );
  });

  const onlineCount = students.filter((s) => s.is_online).length;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Loading students...</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-muted-foreground" />
          <h2 className="font-semibold">Students</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          {onlineCount} online • {students.length} total
        </p>
      </div>

      <div className="border-b p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search students..."
            className="pl-9"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2">
          {filteredStudents.length === 0 ? (
            <p className="p-4 text-center text-sm text-muted-foreground">
              No students found
            </p>
          ) : (
            filteredStudents.map((student) => (
              <div
                key={student.id}
                className="flex items-center gap-3 rounded-lg p-2 hover:bg-muted/50"
              >
                <div className="relative">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>
                      {getInitials(student.display_name || student.username)}
                    </AvatarFallback>
                  </Avatar>
                  <span
                    className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background ${
                      student.is_online ? 'bg-green-500' : 'bg-muted-foreground/30'
                    }`}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">
                    {student.display_name || student.username}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    @{student.username}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
