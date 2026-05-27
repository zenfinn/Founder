export function Link({ href, children }) {
  return (
    <a href={href} className="font-medium text-brand-600 hover:text-brand-700 hover:underline">
      {children}
    </a>
  );
}
