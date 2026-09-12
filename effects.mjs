const motion = matchMedia('(prefers-reduced-motion: reduce)');
document.addEventListener('click', event => {
  const button = event.target.closest('.class-tabs button, .day-tabs button, .view-tabs button, .button, .theme-button');
  if (!button || motion.matches) return;
  button.classList.remove('press-flash');
  void button.offsetWidth;
  button.classList.add('press-flash');
  window.setTimeout(() => button.classList.remove('press-flash'), 650);
  if (button.matches('[data-class], [data-day], [data-view]')) {
    const content = document.querySelector('#schedule-content');
    if (content?.animate) content.animate(
      [{ opacity: .35, transform: 'translateY(9px)' }, { opacity: 1, transform: 'translateY(0)' }],
      { duration: 240, easing: 'cubic-bezier(.2,.7,.2,1)' }
    );
  }
});
