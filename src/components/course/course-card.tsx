import Link from "next/link";
import { BookOpen, Clock } from "lucide-react";
import { cn, toPersianDigits } from "@/lib/utils";

interface CourseCardProps {
  id: string;
  title: string;
  thumbnail?: string;
  coachName: string;
  coachAvatar?: string;
  lessonsCount: number;
  level: string;
  progress?: number; // 0-100
}

const levelMap: Record<string, string> = {
  BEGINNER: "مبتدی",
  INTERMEDIATE: "متوسط",
  ADVANCED: "پیشرفته",
};

const levelColor: Record<string, string> = {
  BEGINNER: "bg-success/10 text-success",
  INTERMEDIATE: "bg-info/10 text-info",
  ADVANCED: "bg-error/10 text-error",
};

export function CourseCard({
  id,
  title,
  thumbnail,
  coachName,
  lessonsCount,
  level,
  progress,
}: CourseCardProps) {
  return (
    <Link href={`/courses/${id}`} className="block group">
      <div className="bg-white rounded-[var(--radius-card)] overflow-hidden shadow-sm border border-surface-container/50 transition-shadow group-hover:shadow-md">
        {/* Thumbnail */}
        <div className="relative aspect-video bg-surface-dim">
          {thumbnail ? (
            <img
              src={thumbnail}
              alt={title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <BookOpen className="w-10 h-10 text-on-surface-muted/30" />
            </div>
          )}

          {/* Level Badge */}
          <span
            className={cn(
              "absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-medium",
              levelColor[level] ?? "bg-surface-dim text-on-surface-muted"
            )}
          >
            {levelMap[level] ?? level}
          </span>

          {/* Progress Bar */}
          {progress !== undefined && progress > 0 && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-surface-container">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-4">
          <h3 className="font-bold text-sm leading-relaxed">{title}</h3>

          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-on-surface-muted">{coachName}</span>
            <div className="flex items-center gap-1 text-xs text-on-surface-muted">
              <BookOpen className="w-3.5 h-3.5" />
              <span>{toPersianDigits(lessonsCount)} درس</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
