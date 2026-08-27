import "./globals.css";
import "./workout-inputs.css";

export const metadata = {
  title: "Adaptive Training",
  description: "A training plan that learns from your workouts, fuel, and progress.",
  manifest: "/manifest.json",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#0B0E0D",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
