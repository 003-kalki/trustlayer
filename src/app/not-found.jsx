// src/app/not-found.jsx
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <h1 className="text-3xl font-bold">404 – Page Not Found</h1>
      <p className="text-muted-foreground mt-2">
        The page you are looking for does not exist.
      </p>
    </div>
  );
}