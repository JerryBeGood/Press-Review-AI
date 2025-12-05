import type { TopicWithCount } from "@/lib/hooks/useArchive";

interface TopicFilterProps {
  topics: TopicWithCount[];
  selectedTopics: Set<string>;
  onToggle: (topic: string) => void;
}

export function TopicFilter({ topics, selectedTopics, onToggle }: TopicFilterProps) {
  if (topics.length === 0) {
    return null;
  }

  return (
    <div role="group" aria-label="Filter by topic" className="flex flex-wrap gap-2 mb-6">
      {topics.map(({ topic, count }) => {
        const isSelected = selectedTopics.has(topic);
        return (
          <button
            key={topic}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onToggle(topic)}
            className={`
              px-3 py-1.5
              border-2 border-black
              shadow-[4px_4px_0px_0px_#000]
              font-mono font-bold text-sm uppercase
              transition-all duration-100
              hover:shadow-[6px_6px_0px_0px_#000] hover:translate-x-[-2px] hover:translate-y-[-2px]
              active:shadow-none active:translate-x-[2px] active:translate-y-[2px]
              ${isSelected ? "bg-[var(--button-blue)]" : "bg-white"}
            `}
          >
            {topic} ({count})
          </button>
        );
      })}
    </div>
  );
}
