/** Every fixed string the site shows. The German dictionary must have the same keys (de.ts is typed against this). */
export const en = {
  nav: {
    home: "Back to the start",
    toggleTheme: "Toggle dark mode",
    switch: { label: "Switch to Deutsch", short: "DE" },
  },
  hero: {
    seeStory: "See my story",
    contact: "Contact",
    tagline: "Agentic Automotive Engineer",
    avatarAlt: "Memoji-style 3D avatar of Fabian with glasses, standing with hands on hips",
  },
  about: { eyebrow: "About" },
  timeline: {
    studies: "Career · Studies",
    education: "Education",
    career: "Career",
    today: "Today",
    tags: "Tags",
    present: "Present",
    months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  },
  agentic: {
    eyebrow: "Now",
    title: "Building with AI agents",
    tools: "Tools",
    sideProjects: "Side projects",
  },
  skills: {
    eyebrow: "Skills",
    title: "What I work with",
    levelOf: "{n} of 5",
    groups: { Languages: "Languages", Automotive: "Automotive", Tooling: "Tooling", Leadership: "Leadership", AI: "AI" },
  },
  launch: {
    eyebrow: "Next · Launch sequence",
    title: "What comes next",
    countdown: "T-0 · Start the countdown",
  },
  contact: {
    eyebrow: "Contact",
    title: "Let's talk",
    email: "Email",
    impressum: "Impressum",
    privacy: "Privacy",
  },
  reducedMotion: {
    title: "Reduced motion is on",
    body: "Your browser asks for less animation, so this page keeps its movement to a minimum.",
    show: "How to enable animations",
    hide: "Hide how to enable animations",
    intro: "For the full animations, turn off reduced motion in your system settings:",
    macos: "macOS:",
    macosPath: "System Settings → Accessibility → Display → Reduce motion",
    windows: "Windows:",
    windowsPath: "Settings → Accessibility → Visual effects → Animation effects (on)",
    ios: "iOS:",
    iosPath: "Settings → Accessibility → Motion → Reduce Motion",
    android: "Android:",
    androidPath: "Settings → Accessibility → Remove animations",
    reload: "Then reload the page.",
  },
};

export type Dictionary = typeof en;
