document.addEventListener('DOMContentLoaded', () => {
  const socialGroups = document.querySelectorAll('.social-icons');

  if (!socialGroups.length) {
    return;
  }

  const icons = [
    {
      href: 'https://www.instagram.com/spac.ece/',
      label: 'Instagram',
      svg: `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
        </svg>
      `
    },
    {
      href: 'https://www.facebook.com/SpacECE/',
      label: 'Facebook',
      svg: `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H7v-3h3V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-1.1 0-2 .9-2 2v1h4l-1 3h-3v6.78c5.05-.5 9-4.76 9-9.78z"></path>
        </svg>
      `
    },
    {
      href: 'https://twitter.com/ece_spac',
      label: 'X (Twitter)',
      svg: `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M18 3h3l-7.5 8.57L22 21h-6.52l-5.1-6.19L4.96 21H2l7.96-9.1L2 3h6.68l4.61 5.59L18 3z"></path>
        </svg>
      `
    }
  ];

  socialGroups.forEach((group) => {
    group.innerHTML = icons
      .map(
        (icon) => `
          <a href="${icon.href}" target="_blank" rel="noopener noreferrer" aria-label="${icon.label}">
            ${icon.svg.trim()}
          </a>
        `
      )
      .join('');
  });
});
