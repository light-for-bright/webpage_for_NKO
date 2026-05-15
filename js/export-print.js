export function setupPrintButton(button) {
  button?.addEventListener('click', () => {
    window.print();
  });
}
