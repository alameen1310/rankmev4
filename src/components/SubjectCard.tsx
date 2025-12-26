import { cn } from '@/lib/utils';
import type { SubjectInfo } from '@/types';

interface SubjectCardProps {
  subject: SubjectInfo;
  onClick: () => void;
  className?: string;
}

export const SubjectCard = ({ subject, onClick, className }: SubjectCardProps) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative overflow-hidden rounded-2xl p-4 text-left transition-all duration-300",
        "glass hover:scale-[1.02] hover:shadow-lg active:scale-[0.98]",
        className
      )}
    >
      <div className={cn(
        "absolute inset-0 opacity-10 transition-opacity group-hover:opacity-20",
        subject.color
      )} />
      
      <div className="relative z-10">
        <span className="text-3xl mb-2 block">{subject.icon}</span>
        <h3 className="font-bold text-lg mb-1">{subject.name}</h3>
        <p className="text-sm text-muted-foreground">
          {subject.questionsCount} questions
        </p>
      </div>

      <div className={cn(
        "absolute top-2 right-2 w-2 h-2 rounded-full",
        subject.color
      )} />
    </button>
  );
};
