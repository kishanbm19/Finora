export default function Table({ columns, data, emptyMessage = "No records found." }) {
  if (!data || data.length === 0) {
    return (
      <div className="loader" style={{ padding: 32 }}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <table className="table">
      <thead>
        <tr>
          {columns.map((col) => (
            <th key={col.key}>{col.header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row) => (
          <tr key={row.id}>
            {columns.map((col) => (
              <td key={col.key}>{col.render ? col.render(row) : row[col.key]}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
