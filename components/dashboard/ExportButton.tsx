export default function ExportButton() {
  return (
    <a href="/api/export/cases" download className="btn-secondary">
      Export CSV
    </a>
  );
}
