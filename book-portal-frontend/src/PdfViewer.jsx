import { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

function PdfViewer({ bookId, authHeader }) {
  const canvasRef = useRef(null);
  const renderTaskRef = useRef(null);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [pageNum, setPageNum] = useState(1);
  const [numPages, setNumPages] = useState(0);

  useEffect(() => {
    const fileUrl = `http://localhost:8080/api/books/${bookId}/file`;
    const progressUrl = `http://localhost:8080/api/progress/${bookId}`;

    Promise.all([
      fetch(fileUrl, { headers: { 'Authorization': authHeader } })
        .then(response => response.blob())
        .then(blob => blob.arrayBuffer())
        .then(arrayBuffer => pdfjsLib.getDocument({ data: arrayBuffer }).promise),
      fetch(progressUrl, { headers: { 'Authorization': authHeader } })
        .then(response => response.status === 204 ? null : response.json())
    ])
      .then(([pdf, progress]) => {
        setPdfDoc(pdf);
        setNumPages(pdf.numPages);
        setPageNum(progress?.lastPage ?? 1);
      })
      .catch(error => console.error('Error loading PDF or progress:', error));
  }, [bookId, authHeader]);

  useEffect(() => {
    if (!pdfDoc) return;

    // Cancel any render still in progress before starting a new one
    if (renderTaskRef.current) {
      renderTaskRef.current.cancel();
    }

    pdfDoc.getPage(pageNum).then(page => {
      const viewport = page.getViewport({ scale: 1.5 });
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const renderTask = page.render({ canvasContext: context, viewport });
      renderTaskRef.current = renderTask;

      renderTask.promise
        .then(() => {
          renderTaskRef.current = null;
        })
        .catch(error => {
          // Ignore cancellation errors — they're expected when we cancel on purpose
          if (error.name !== 'RenderingCancelledException') {
            console.error('Render error:', error);
          }
        });
    });

    fetch('http://localhost:8080/api/progress', {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ bookId, lastPage: pageNum })
    }).catch(error => console.error('Error saving progress:', error));
  }, [pdfDoc, pageNum]);

  const percentRead = numPages ? Math.round((pageNum / numPages) * 100) : 0;

  return (
    <div>
      <canvas ref={canvasRef}></canvas>
      <div>
        <button onClick={() => setPageNum(p => Math.max(1, p - 1))} disabled={pageNum <= 1}>
          Previous
        </button>
        <span> Page {pageNum} of {numPages} ({percentRead}% read) </span>
        <button onClick={() => setPageNum(p => Math.min(numPages, p + 1))} disabled={pageNum >= numPages}>
          Next
        </button>
      </div>
    </div>
  );
}

export default PdfViewer;