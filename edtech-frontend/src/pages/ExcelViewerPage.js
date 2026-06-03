import React, { useEffect, useState } from "react";
import axios from "axios";

export default function ExcelViewerPage() {
  const [treeData, setTreeData] = useState([]);
  const [selected, setSelected] = useState(null);
  const [csvData, setCsvData] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchTree();
  }, []);

  const fetchTree = async () => {
    const res = await axios.get("http://localhost:5000/api/folder-structure");
    setTreeData(res.data);
  };

  useEffect(() => {
    if (selected?.fullPath && selected.name.endsWith(".csv")) {
      axios
        .get("http://localhost:5000/api/read-csv", {
          params: { filePath: selected.fullPath },
        })
        .then((res) => setCsvData(res.data))
        .catch((err) => {
          console.error("CSV 로딩 실패:", err);
          setCsvData(null);
        });
    } else {
      setCsvData(null);
    }
  }, [selected]);

  const handleDownload = () => {
    if (!selected?.fullPath) return;
    const encodedPath = encodeURIComponent(selected.fullPath);
    window.open(`http://localhost:5000/api/download?filePath=${encodedPath}`, "_blank");
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !selected?.fullPath) return;

    const isDirectory = selected.children?.length > 0;
    if (!isDirectory) {
      alert("📂 업로드는 폴더를 선택한 상태에서만 가능합니다.");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("targetPath", selected.fullPath);

    try {
      const res = await axios.post("http://localhost:5000/api/upload", formData);
      alert(`✅ 업로드 완료: ${res.data.filename}`);
      await fetchTree();
    } catch (err) {
      console.error("❌ 업로드 실패", err);
      alert("업로드 실패");
    } finally {
      setUploading(false);
      e.target.value = null;
    }
  };

  const renderFolderView = (nodes) => {
    return nodes.map((folder) => (
      <div key={folder.id} className="mb-4">
        <h3 className="font-semibold text-gray-700 text-sm mb-1">📁 {folder.name}</h3>
        <div className="ml-4">
          {folder.children?.filter(child => child.name.endsWith(".csv")).map((file) => (
            <div
              key={file.id}
              className={`cursor-pointer text-sm px-2 py-1 rounded hover:bg-blue-100 ${
                selected?.id === file.id ? "bg-blue-200 font-semibold" : ""
              }`}
              onClick={() => setSelected(file)}
            >
              📄 {file.name}
            </div>
          ))}
        </div>
      </div>
    ));
  };

  return (
    <div className="flex h-screen text-gray-800 bg-white">
      {/* 좌측 폴더 구조 */}
      <aside className="w-[400px] min-w-[380px] max-w-[450px] border-r p-4 bg-gray-50 overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">📂 폴더 구조</h2>
        {renderFolderView(treeData)}
      </aside>

      {/* 우측 상세 영역 */}
      <main className="flex-1 p-6 overflow-x-auto">
        <h2 className="text-xl font-semibold mb-4">선택된 파일 또는 폴더</h2>

        <div className="flex items-center gap-4 mb-4">
          {selected?.name?.endsWith(".csv") && (
            <button
              onClick={handleDownload}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              ⬇ CSV 다운로드
            </button>
          )}

          {selected?.children && (
            <label className="cursor-pointer px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
              ⬆ CSV 업로드
              <input
                type="file"
                accept=".csv"
                onChange={handleUpload}
                className="hidden"
                disabled={uploading}
              />
            </label>
          )}
        </div>

        {csvData ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border border-gray-300">
              <thead className="bg-gray-100 border-b">
                <tr>
                  {csvData.headers.map((header, idx) => (
                    <th key={idx} className="px-2 py-1 border">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {csvData.rows.slice(0, 500).map((row, idx) => (
                  <tr key={idx} className="even:bg-gray-50">
                    {csvData.headers.map((header, colIdx) => (
                      <td key={colIdx} className="px-2 py-1 border whitespace-nowrap">
                        {row[header]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : selected ? (
          <pre className="text-sm whitespace-pre-wrap break-all">
            {JSON.stringify(selected, null, 2)}
          </pre>
        ) : (
          <div className="text-gray-500">왼쪽에서 항목을 선택하세요.</div>
        )}
      </main>
    </div>
  );
}