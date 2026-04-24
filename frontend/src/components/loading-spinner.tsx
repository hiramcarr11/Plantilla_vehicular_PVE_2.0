export function LoadingSpinner({ message = 'Cargando...' }: { message?: string }) {
  return (
    <div className="loading-spinner">
      <div className="loading-spinner-ring" />
      <p>{message}</p>
    </div>
  );
}
