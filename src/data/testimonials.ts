export interface Testimonial {
  quote: string;
  name: string;
  role: string;
  company: string;
  linkedinUrl: string;
}

export const testimonials: Testimonial[] = [
  {
    quote: 'Fahad is a solid addition to any software team. I saw him consistently deliver high-value outcomes that drove our engineering and product vision. Reliable and easy to work with, with the ability to adapt to ever changing AI paradigms quickly too. I saw him lead the frontend team when working together on "Nomod", taking ownership of both technical delivery and team coordination. Versatile combo of technical expertise, accountability, and teamwork makes him someone I would blindly recommend to any engineering team.',
    name: 'Muhammad Danish',
    role: 'SWE',
    company: 'Nomod (YC S21) · Microsoft MVP (Windows Development)',
    linkedinUrl: 'https://www.linkedin.com/in/mdanish-kh/',
  },
];
