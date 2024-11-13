// components/Navbar/navData.ts
export interface NavMenuItem {
    title: string;
    href?: string;
  }
  
  export interface NavMenuData {
    [key: string]: NavMenuItem[];
  }
  
  export const navMenuData: NavMenuData = {
    'Services': [
      { title: 'Ovulation Induction With Timed Intercourse', href: '/services/ovulation-induction' },
      { title: 'IUI - Intra Uterine Insemination', href: '/services/iui' },
      { title: 'IVF - In Vitro Fertilization', href: '/services/ivf' },
      { title: 'Minimally Invasive Surgery', href: '/services/minimally-invasive-surgery' },
      { title: 'IVM - In Vitro Maturation Of Oocytes', href: '/services/ivm' },
      { title: 'Fertility Preservation', href: '/services/fertility-preservation' },
      { title: 'PGS - Pre Implantation Genetic Screening', href: '/services/pgs' },
      { title: 'Freezing/Vitrification', href: '/services/freezing-vitrification' }
    ],
    'Our Centres': [
      { title: 'Hyderabad', href: '/centres/hyderabad' },
      { title: 'Bangalore', href: '/centres/bangalore' },
      { title: 'Chennai', href: '/centres/chennai' },
      { title: 'Vijayawada', href: '/centres/vijayawada' },
      { title: 'Pune', href: '/centres/pune' }
    ],
    'Fertility Care': [
      { title: 'Female Infertility', href: '/fertility-care/female' },
      { title: 'Male Infertility', href: '/fertility-care/male' },
      { title: 'IVF Treatment', href: '/fertility-care/ivf' },
      { title: 'Natural Cycle IVF', href: '/fertility-care/natural-cycle-ivf' },
      { title: 'Surgical Sperm Retrieval', href: '/fertility-care/surgical-sperm-retrieval' }
    ],
    'About Us': [
      { title: 'About Oasis', href: '/about' },
      { title: 'Vision & Mission', href: '/about/vision-mission' },
      { title: 'Infrastructure', href: '/about/infrastructure' },
      { title: 'Technology', href: '/about/technology' },
      { title: 'Media', href: '/about/media' }
    ],
    'Why Oasis?': [
      { title: 'Success Rates', href: '/why-oasis/success-rates' },
      { title: 'Patient Testimonials', href: '/why-oasis/testimonials' },
      { title: 'Awards & Accolades', href: '/why-oasis/awards' },
      { title: 'Research & Publications', href: '/why-oasis/research' }
    ]
  };