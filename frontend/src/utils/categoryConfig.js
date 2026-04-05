export const categoryConfig = {
  Housing: { color: "#EF4444", icon: "🏠" },
  Food: { color: "#FACC15", icon: "🍔" },
  Transport: { color: "#3B82F6", icon: "🚗" },
  Utilities: { color: "#14B8A6", icon: "💡" },
  Insurance: { color: "#6366F1", icon: "🛡️" },
  Medical: { color: "#10B981", icon: "💊" },
  'Saving Tools': { color: "#8B5CF6", icon: "💰" },
  Personal: { color: "#F97316", icon: "👤" },
  Entertainment: { color: "#EC4899", icon: "🎬" },
  Fallback: { color: "#6B7280", icon: "❓" }
};

export const getCategoryData = (categoryName) => {
  return categoryConfig[categoryName] || categoryConfig.Fallback;
};
