export const projects = {
  fashion: {
    href: 'https://www.behance.net/gallery/216457395/International-Fashion-Show-Website-Redesign',
    image: 'IFDwork.png',
    title: 'How I redesigned a fashion contest site',
    description: 'Improving consistency and content structure',
    preview: {
      image: 'IFDindex.png',
      alt: 'International Fashion Show website redesign case study',
    },
  },
  hop: {
    href: 'https://www.behance.net/gallery/163104401/Hop-App-UIUX-Case-Study',
    image: 'Hopappwork.png',
    title: 'How I redesigned a travel app',
    description: 'Simplifying the design to reduce overload',
    preview: {
      image: 'Hopappindex.png',
      alt: 'Hop App travel app redesign case study',
    },
  },
  cloud: {
    href: 'https://www.behance.net/gallery/142352791/Cloud-9-app-UX-Case-Study',
    image: 'Cloud9work.png',
    title: 'how i created a niche weather app',
    description: 'Making days on the water safe and fun',
    preview: {
      image: 'Cloud9index.png',
      alt: 'Cloud 9 weather app case study',
    },
  },
  rapuha: {
    href: 'https://www.behance.net/gallery/170639797/Rapuha-Brand-Design',
    image: 'Rapuhawork.png',
    title: 'how i created a visual identity for dev team',
    description: 'Helping a team stand out and present values',
  },
} as const;

export type Project = (typeof projects)[keyof typeof projects];
