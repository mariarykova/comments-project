export const formatDate = (timestamp) => {
  if (!timestamp || !timestamp.seconds) return "Unknown Date";

  const date = new Date(timestamp.seconds * 1000);

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};
