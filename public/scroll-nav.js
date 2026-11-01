// Percentages in rootMargin resolve against viewport width, so a tall
// percentage inset can erase the observation band on a wide screen.
function observationInsets(height) {
  const top = Math.min(96, Math.max(0, height - 1));
  const available = Math.max(1, height - top);
  const band = Math.max(1, Math.min(available, Math.round(height * 0.45)));
  const bottom = Math.max(0, available - band);
  return { top, rootMargin: `-${top}px 0px -${bottom}px 0px` };
}

const nav = document.querySelector('nav[aria-label="Primary"]');
if (nav && 'IntersectionObserver' in window) {
  const links = [...nav.querySelectorAll('a[href*="#"]')];
  const sections = links.flatMap((link) => {
    const href = link.getAttribute('href') ?? '';
    const id = href.slice(href.indexOf('#') + 1);
    const section = id ? document.getElementById(id) : null;
    return section ? [section] : [];
  });

  if (sections.length > 0) {
    let active = '';
    const visible = new Set();
    const mark = (id) => {
      if (!id || id === active) return;
      active = id;
      for (const link of links) {
        const href = link.getAttribute('href') ?? '';
        const linkId = href.slice(href.indexOf('#') + 1);
        if (linkId === id) link.setAttribute('aria-current', 'true');
        else link.removeAttribute('aria-current');
      }
    };

    const onEntries = (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) visible.add(entry.target.id);
        else visible.delete(entry.target.id);
      }
      // An edge touch still counts as intersecting. When a jump lands on the
      // activation line, the later section that has reached it is current.
      const line = observationInsets(window.innerHeight).top;
      const intersecting = sections.filter((section) => visible.has(section.id));
      const reached = intersecting.filter((section) => section.getBoundingClientRect().top <= line + 1);
      const current = reached.at(-1) ?? intersecting[0];
      if (current) mark(current.id);
    };

    let observer;
    const connect = () => {
      if (observer) observer.disconnect();
      visible.clear();
      observer = new IntersectionObserver(onEntries, {
        rootMargin: observationInsets(window.innerHeight).rootMargin,
        threshold: 0,
      });
      for (const section of sections) observer.observe(section);
    };

    connect();
    window.addEventListener('resize', connect);
  }
}
