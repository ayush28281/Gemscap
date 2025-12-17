export const downloadFile = async (
    url: string,
    filename: string,
    type: 'json' | 'csv'
  ) => {
    const res = await fetch(url);
    const text = await res.text();
  
    const blob = new Blob([text], {
      type: type === 'csv' ? 'text/csv' : 'application/json',
    });
  
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(link.href);
  };
  