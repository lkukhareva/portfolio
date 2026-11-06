export const projects = {
  fashion: {
    href: 'https://www.behance.net/gallery/216457395/International-Fashion-Show-Website-Redesign',
    image: 'IFDwork.webp',
    title: 'How I redesigned a fashion contest site',
    description: 'Improving consistency and content structure',
  },
  hop: {
    href: 'https://www.behance.net/gallery/163104401/Hop-App-UIUX-Case-Study',
    image: 'Hopappwork.webp',
    title: 'How I redesigned a travel app',
    description: 'Simplifying the design to reduce overload',
  },
  cloud: {
    href: 'https://www.behance.net/gallery/142352791/Cloud-9-app-UX-Case-Study',
    image: 'Cloud9work.webp',
    title: 'how i created a niche weather app',
    description: 'Making days on the water safe and fun',
  },
  rapuha: {
    href: 'https://www.behance.net/gallery/170639797/Rapuha-Brand-Design',
    image: 'Rapuhawork.webp',
    title: 'how i created a visual identity for dev team',
    description: 'Helping a team stand out and present values',
  },
} as const;

export type Project = (typeof projects)[keyof typeof projects];
