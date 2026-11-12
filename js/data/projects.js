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
//    links         { liveDemo, github, figma, caseStudy }  — full URLs starting with https://  ('' hides that button)
//    accent        card colour used when there is no image: 'sun' | 'bloom' | 'dusk'
// ============================================================================

export const PROJECTS = [
  {
    id: 'interactive-portfolio',
    title: 'Interactive Portfolio',
    year: '2026',
    categories: ['Web Development', 'UI/UX Design', 'Illustration', 'Branding', 'AI-Assisted Development'],
    summary: 'An interactive portfolio where original artwork meets playful web development.',
    peek: 'Explore a creative digital space featuring a lively character, playful interactions, and custom-built animations.',
    overview:
      'A personal portfolio designed to showcase my projects, creative work, and skills as a Computer Science student. It combines my interest in technology and art through an illustrated character, interactive animations, and a playful yet functional interface.\n\n' +
    'Built with HTML, CSS, and JavaScript, with AI-assisted development used to help bring my original concepts and designs to life.',
    contributions: [
      'Designed the UI/UX and created the original character illustrations and layered assets',
    'Developed interactive animations, eye tracking, and draggable objects using JavaScript',
    'Implemented responsive layouts, light and dark modes, and interactive sound effects',
    ],
    technologies: ['HTML5', 'CSS3', 'JavaScript', 'Procreate', 'Figma', "Claude AI"],
    links: { liveDemo: '', github: '', figma: 'https://www.figma.com/design/8WMe3PSDxeeRReThQnOq5Q/Kae-s-Mini-Portfolio?node-id=0-1&t=cfrXU19QKFLLIQDq-1', caseStudy: '' }, 
    images: [
      // { src: 'imgs/projects/interactive-portfolio/cover.webp', alt: 'Portfolio home page' },
      { src: 'imgs/projects/interactive-portfolio/cover.webp', alt: 'Portfolio home page' },
      { src: 'imgs/projects/interactive-portfolio/contact.webp', alt: 'Portfolio contact page' },
    ],
    accent: 'sun',
  },
  {
    id: 'artifact-ar-system',
    title: 'ArtiFact: Museum AR Experience',
    year: '2026',
    categories: ['Augmented Reality', 'Web Development', 'UI/UX Design'],
    summary: 'Bringing museum artworks to life through interactive augmented reality and gamified learning.',
    peek: 'Explore paintings, uncover their stories, and learn through AR experiences, quizzes, and interactive challenges.',
    overview:
      'ArtiFact is a gamified web-based augmented reality system developed for the National Museum of Fine Arts. It uses Homography, ORB, and RANSAC for image identification, allowing visitors to interact with selected paintings through AR overlays and access additional artwork information.\n\n' +
      'The system also features multilingual content, interactive quizzes, puzzles, a digital passport, and certificates to encourage engaging museum exploration. Developed as a mobile-friendly Progressive Web App (PWA), it provides visitors with an accessible and interactive learning experience.',
    contributions: [
      'Led project coordination, team communication, task delegation, and deliverables',
      'Designed the application UI/UX and interactive user flows',
      'Organized and managed application data using Supabase',
      'Analyzed system testing results and user feedback using Microsoft Excel',
    ],
    technologies: [
      'Augmented Reality',
      'Homography',
      'ORB',
      'RANSAC',
      'Supabase',
      'Progressive Web App',
      'Figma',
    ],
    links: { liveDemo: '', github: 'https://github.com/yawnydoki/artifact-nmfa', figma: 'https://www.figma.com/design/wAg74EDF5ouAWWJCFdIe8E/ArtiFact-NMFA?node-id=0-1&t=7BIFnK84jwQ9CRpb-1', caseStudy: 'https://drive.google.com/file/d/1Hygem8Bkc2pKlWbbByUdJqwsRfzP5MFN/view?usp=sharing' }, 
    images: [
      { src: 'imgs/projects/artifact-ar-system/cover.webp', alt: 'ArtiFact home page' },
    ],
    accent: 'dusk',
  },
  {
    id: 'ez-pz-study-web-app',
    title: 'EzPz: Study Web App',
    year: '2025',
    categories: ['UI/UX Design', 'Web Development', 'AI-Assisted Development', 'Productivity'],
    summary: 'A study companion designed to make reviewing, organizing, and learning simpler.',
    peek: 'A personalized study space with flashcards, quizzes, practice questions, and study timers.',
    overview: 'EzPz is a web-based study application designed to help students organize learning materials and make reviewing more manageable. It brings together interactive study tools, including flashcards, randomized quizzes, practice questions, and customizable study timers in one accessible platform.\n\n' +
    'Built with a focus on simplicity and usability, the project explores how thoughtful UI/UX design and frontend development can support better study habits.',
    contributions: [ 'Designed the application interface and user experience using Figma',
    'Developed interactive flashcards, quizzes, practice questions, and study timers',
    'Implemented course and category organization with Supabase database integration',
    'Built the application as a responsive Progressive Web App (PWA)',],
    technologies: ['Figma', 'HTML5', 'CSS3', 'JavaScript', 'Supabase', "Vercel", "Claude AI", "ChatGPT"],
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
