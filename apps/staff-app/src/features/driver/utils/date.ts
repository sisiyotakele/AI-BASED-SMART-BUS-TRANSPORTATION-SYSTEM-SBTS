// src/features/driver/utils/date.ts

export const formatDate = (dateStr: string, referenceDate?: string): string => {
  const d = new Date(dateStr);
  const ref = referenceDate ? new Date(referenceDate) : new Date();
  const diffDays = Math.round((ref.getTime() - d.getTime()) / 86400000);
  
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

export const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return "🌅 Good morning";
  if (hour < 17) return "☀️ Good afternoon";
  if (hour < 21) return "🌆 Good evening";
  return "🌙 Good night";
};

export const getInitials = (name: string): string => {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

export const formatTime = (minutes: number): string => {
  if (minutes < 1) return "< 1 min";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
};