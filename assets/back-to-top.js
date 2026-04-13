document.addEventListener('DOMContentLoaded', () => {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'back-to-top';
  button.setAttribute('aria-label', 'Back to top');
  button.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M12 19V5"></path>
      <path d="M5 12l7-7 7 7"></path>
    </svg>
  `;

  document.body.appendChild(button);

  const toggleVisibility = () => {
    if (window.scrollY > 240) {
      button.classList.add('is-visible');
      return;
    }

    button.classList.remove('is-visible');
  };

  button.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });

  window.addEventListener('scroll', toggleVisibility, { passive: true });
  toggleVisibility();
});
