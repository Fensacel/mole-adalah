interface StatCardProps {
  label: string;
  value: string;
  color: "green" | "purple" | "blue" | "orange";
  description?: string;
}

const colorMap = {
  green: {
    bg: "bg-green-500/10",
    border: "border-green-500/20",
    text: "text-green-400",
    glow: "shadow-[0_0_20px_rgba(74,222,128,0.1)]",
  },
  purple: {
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
    text: "text-purple-400",
    glow: "shadow-[0_0_20px_rgba(168,85,247,0.1)]",
  },
  blue: {
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    text: "text-blue-400",
    glow: "shadow-[0_0_20px_rgba(59,130,246,0.1)]",
  },
  orange: {
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    text: "text-blue-400",
    glow: "shadow-[0_0_20px_rgba(59,130,246,0.12)]",
  },
};

export default function StatCard({ label, value, color, description }: StatCardProps) {
  const c = colorMap[color];
  return (
    <div className={`${c.bg} border ${c.border} rounded-xl p-5 ${c.glow}`}>
      <p className="text-xs text-gray-500 uppercase tracking-widest font-medium mb-2">{label}</p>
      <p className={`text-4xl font-black ${c.text}`}>{value}</p>
      {description && <p className="text-xs text-gray-500 mt-2">{description}</p>}
    </div>
  );
}
