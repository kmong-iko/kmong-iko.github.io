// ============================================================================
//  DEVELOPMENT PROJECTS  —  edit this file to add, remove or change projects.
//  No database needed: the Workfolio cards and the project popups are built from this list.
// ============================================================================
//
//  HOW TO ADD A PROJECT
//    1. Copy one whole { ... }, block below and paste it where you want it to appear (first = leftmost card).
//    2. Give it a unique `id` (lowercase, no spaces, e.g. 'my-new-app').
//    3. Fill in the fields. Anything you leave empty ('' or []) is simply hidden.
//
//  HOW TO ADD IMAGES
//    1. Put your image files in:  imgs/projects/<project-id>/      e.g.  imgs/projects/my-new-app/cover.webp
//    2. List them in `images` using a path relative to index.html, for example:
//         images: [
//           { src: 'imgs/projects/my-new-app/cover.webp',  alt: 'Home screen of My New App' },
//           { src: 'imgs/projects/my-new-app/screen-2.webp', alt: 'Settings page' },
//         ],
//    3. The FIRST image is used as the card thumbnail and the first slide in the popup.
//       Add as many as you like: the popup gets arrows + dots and fades between them.
//    Tip: .webp or .jpg around 1600px wide keeps the page fast. With no images, a soft grey placeholder is shown.
//
//  FIELD GUIDE
//    id            unique short name (also the image folder name)
//    title         project title
//    year          '2025' or a range like '2025 - 2026'
//    categories    list of tags, e.g. ['Web Development', 'UI/UX Design']  (colours: see CATEGORY_COLORS below)
//    summary       ONE short line shown on the card
//    peek          the sneak-peek text shown when the card is hovered (falls back to `summary` if empty)
//    overview      the paragraph(s) in the popup under "Overview" (use \n\n between paragraphs)
//    contributions list of bullet points under "My Contributions"
//    technologies  list of names under "Tools & Technologies"
//    links         { liveDemo, github, caseStudy }  — full URLs starting with https://  ('' hides that button)
//    accent        card colour used when there is no image: 'sun' | 'bloom' | 'dusk'
// ============================================================================

export const PROJECTS = [
  {
    id: 'interactive-portfolio',
    title: 'Interactive Portfolio',
    year: '2025 - 2026',
    categories: ['Web Development', 'UI/UX Design'],
    summary: 'This site: a layered illustration brought to life with eye tracking, physics, and a little personality.',
    peek: 'A layered illustration brought to life with eye tracking, a draggable mug and a chatty little character.',
    overview:
      'PLACEHOLDER: replace this with a short description of what the project is, who it is for and why you made it.\n\n' +
      'Use a blank line (\\n\\n) to start a new paragraph.',
    contributions: [
      'PLACEHOLDER: Designed the interface and illustrated every character layer',
      'PLACEHOLDER: Built the animations and interactions in vanilla JavaScript',
    ],
    technologies: ['HTML5', 'CSS3', 'JavaScript'],
    links: { liveDemo: '', github: '', caseStudy: '' },
    images: [
      // { src: 'imgs/projects/interactive-portfolio/cover.webp', alt: 'Portfolio home page' },
    ],
    accent: 'sun',
  },
  {
    id: 'character-mascot-art',
    title: 'Character & Mascot Art',
    year: '2025',
    categories: ['Illustration', 'Branding'],
    summary: 'Original characters and stickers, drawn to be loved first and animated second.',
    peek: 'Original characters and stickers, drawn to be loved first and animated second.',
    overview: 'PLACEHOLDER: describe this project here.',
    contributions: ['PLACEHOLDER: what you did on this project'],
    technologies: ['Procreate', 'Affinity'],
    links: { liveDemo: '', github: '', caseStudy: '' },
    images: [],
    accent: 'bloom',
  },
  {
    id: 'product-design-case-study',
    title: 'Product Design Case Study',
    year: '2026',
    categories: ['UI/UX Design', 'Prototyping'],
    summary: 'From research and flows to a polished, tested interface. The problem, the process, the outcome.',
    peek: 'From research and flows to a polished, tested interface. The problem, the process, the outcome.',
    overview: 'PLACEHOLDER: describe this project here.',
    contributions: ['PLACEHOLDER: what you did on this project'],
    technologies: ['Figma'],
    links: { liveDemo: '', github: '', caseStudy: '' },
    images: [],
    accent: 'dusk',
  },
];

// Tag colours in the popup. Add your own category names here; unknown ones cycle through FALLBACK_COLORS.
export const CATEGORY_COLORS = {
  'Web Development': '#2d8cff',
  'UI/UX Design': '#6a4cff',
  'Illustration': '#e0529c',
  'Branding': '#14a38b',
  'Prototyping': '#6a4cff',
};
export const FALLBACK_COLORS = ['#2d8cff', '#6a4cff', '#e0529c', '#14a38b'];
