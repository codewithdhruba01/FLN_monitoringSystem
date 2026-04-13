document.addEventListener('DOMContentLoaded', () => {
  const header = document.querySelector('.navbar');
  const toggle = header?.querySelector('.nav-toggle');
  const panel = header?.querySelector('.mobile-nav-panel');
  const navLinks = header?.querySelector('.nav-links');
  const actionButton = header?.querySelector('.btn-write');

  if (!header || !toggle || !panel || !navLinks) {
    return;
  }

  const resolveActionHref = (element) => {
    if (!element) {
      return '#';
    }

    if (element.tagName.toLowerCase() === 'a') {
      return element.getAttribute('href') || '#';
    }

    const onclick = element.getAttribute('onclick') || '';
    const match = onclick.match(/location\.href\s*=\s*['"]([^'"]+)['"]/);
    return match ? match[1] : '#';
  };

  const mobileLinks = document.createElement('div');
  mobileLinks.className = 'mobile-nav-links';

  navLinks.querySelectorAll('a').forEach((link) => {
    mobileLinks.appendChild(link.cloneNode(true));
  });

  panel.appendChild(mobileLinks);

  if (actionButton) {
    const mobileActions = document.createElement('div');
    mobileActions.className = 'mobile-nav-actions';

    const mobileAction = document.createElement('a');
    mobileAction.className = 'btn-write mobile-nav-action';
    mobileAction.href = resolveActionHref(actionButton);
    mobileAction.textContent = actionButton.textContent.trim();

    mobileActions.appendChild(mobileAction);
    panel.appendChild(mobileActions);
  }

  const closeMenu = () => {
    document.body.classList.remove('nav-open');
    toggle.setAttribute('aria-expanded', 'false');
    panel.hidden = true;
  };

  const openMenu = () => {
    document.body.classList.add('nav-open');
    toggle.setAttribute('aria-expanded', 'true');
    panel.hidden = false;
  };

  closeMenu();

  toggle.addEventListener('click', () => {
    if (panel.hidden) {
      openMenu();
      return;
    }

    closeMenu();
  });

  panel.addEventListener('click', (event) => {
    if (event.target.closest('a')) {
      closeMenu();
    }
  });

  document.addEventListener('click', (event) => {
    if (!header.contains(event.target)) {
      closeMenu();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeMenu();
    }
  });

  const desktopMedia = window.matchMedia('(min-width: 1025px)');
  const handleDesktopChange = (event) => {
    if (event.matches) {
      closeMenu();
    }
  };

  if (desktopMedia.addEventListener) {
    desktopMedia.addEventListener('change', handleDesktopChange);
  } else if (desktopMedia.addListener) {
    desktopMedia.addListener(handleDesktopChange);
  }
});
