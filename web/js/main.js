// Basic interactivity for demo: analyze button and nav
document.addEventListener('DOMContentLoaded', () => {
  const analyze = document.getElementById('analyze-btn');
  const input = document.getElementById('symptom-input');
  if (analyze) {
    analyze.addEventListener('click', () => {
      const text = input ? input.value.trim() : '';
      if (!text) {
        alert('Please enter symptoms to analyze (demo)');
        return;
      }
      // demo behavior: show message
      analyze.textContent = 'Analyzing...';
      setTimeout(() => {
        analyze.textContent = 'Analyze';
        alert('Analysis complete (demo).');
      }, 900);
    });
  }

  // nav active state
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.nav-item').forEach(b=>b.classList.remove('active'));
      e.currentTarget.classList.add('active');
    });
  });
});
