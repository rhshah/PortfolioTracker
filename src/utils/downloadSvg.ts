export function downloadSVG(containerId: string, filename: string) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const svgElement = container.querySelector('svg');
  if (!svgElement) return;

  // Clone the SVG to avoid modifying the original
  const clone = svgElement.cloneNode(true) as SVGElement;
  
  // Ensure xmlns is set
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  
  const svgData = new XMLSerializer().serializeToString(clone);
  const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
