import { useState, useEffect } from 'react';
import Login from './Login';
import PdfViewer from './PdfViewer';

function App() {
  const [token, setToken] = useState(localStorage.getItem('jwt'));
  const [books, setBooks] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [openBookId, setOpenBookId] = useState(null);
  const [progressMap, setProgressMap] = useState({});
  const authHeader = `Bearer ${token}`;

  const fetchBooks = () => {
    fetch('http://localhost:8080/api/books', {
      headers: { 'Authorization': authHeader }
    })
      .then(response => response.json())
      .then(data => {
        setBooks(data);
        data.forEach(book => {
          fetch(`http://localhost:8080/api/progress/${book.id}`, {
            headers: { 'Authorization': authHeader }
          })
            .then(response => response.status === 204 ? null : response.json())
            .then(progress => {
              if (progress) {
                setProgressMap(prev => ({ ...prev, [book.id]: progress.lastPage }));
              }
            });
        });
      })
      .catch(error => console.error('Error fetching books:', error));
  };

  useEffect(() => {
    if (token) fetchBooks();
  }, [token]);

  if (!token) {
    return <Login onLoginSuccess={(newToken) => setToken(newToken)} />;
  }

  const handleLogout = () => {
    localStorage.removeItem('jwt');
    setToken(null);
    setBooks([]);
    setOpenBookId(null);
    setProgressMap({});
  };

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleUpload = () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append('file', selectedFile);

    fetch('http://localhost:8080/api/books/upload', {
      method: 'POST',
      headers: { 'Authorization': authHeader },
      body: formData
    })
      .then(response => response.json())
      .then(() => {
        setSelectedFile(null);
        fetchBooks();
      })
      .catch(error => console.error('Error uploading book:', error));
  };

  return (
    <div>
      <h1>My Books</h1>
      <button onClick={handleLogout}>Log Out</button>

      <input type="file" accept="application/pdf" onChange={handleFileChange} />
      <button onClick={handleUpload} disabled={!selectedFile}>Upload</button>

      <ul>
        {books.map(book => {
          const lastPage = progressMap[book.id];
          const percent = lastPage && book.totalPages
            ? Math.round((lastPage / book.totalPages) * 100)
            : 0;

          return (
            <li key={book.id} onClick={() => setOpenBookId(book.id)} style={{ cursor: 'pointer' }}>
              {book.title} {lastPage ? `— ${percent}% read` : '(not started)'}
            </li>
          );
        })}
      </ul>

      {openBookId && <PdfViewer key={openBookId} bookId={openBookId} authHeader={authHeader} />}
    </div>
  );
}

export default App;