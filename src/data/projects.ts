export const projects = {
  fashion: {
    href: 'https://www.behance.net/gallery/216457395/International-Fashion-Show-Website-Redesign',
    image: 'IFDwork.webp',
    title: 'International Fashion Show website',
    description: 'How I redesigned a fashion contest site, improving consistency and content structure.',
  },
  hop: {
    href: 'https://www.behance.net/gallery/163104401/Hop-App-UIUX-Case-Study',
    image: 'Hopappwork.webp',
    title: 'Hop travel app',
    description: 'How I redesigned a travel app, simplifying the design to reduce overload.',
  },
  cloud: {
    href: 'https://www.behance.net/gallery/142352791/Cloud-9-app-UX-Case-Study',
    image: 'Cloud9work.webp',
    title: 'Cloud 9 weather app',
    description: 'How I created a niche weather app, making days on the water safe and fun.',
  },
  rapuha: {
    href: 'https://www.behance.net/gallery/170639797/Rapuha-Brand-Design',
    image: 'Rapuhawork.webp',
    title: 'Rapuha brand identity',
    description: 'How I created a visual identity for a dev team, helping it stand out and present its values.',
  },
} as const;

export type Project = (typeof projects)[keyof typeof projects];
