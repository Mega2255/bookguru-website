// src/pages/admin/AdminCBT.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";

const API = "http://localhost:5000";

export default function AdminCBT() {
  const token = localStorage.getItem("token");

  // Subjects
  const [subjects, setSubjects] = useState([]);
  const [selSubject, setSelSubject] = useState(null);

  // Subject form
  const [sname, setSname] = useState("");
  const [sslug, setSslug] = useState("");
  const [smax, setSmax] = useState(100);
  const [stime, setStime] = useState(30);

  // Question form
  const [qText, setQText] = useState("");
  const [optA, setOptA] = useState("");
  const [optB, setOptB] = useState("");
  const [optC, setOptC] = useState("");
  const [optD, setOptD] = useState("");
  const [correct, setCorrect] = useState("A");
  const [explanation, setExplanation] = useState("");
  const [image, setImage] = useState(null);
  const [questions, setQuestions] = useState([]);

  // Bulk upload
  const [bulkFile, setBulkFile] = useState(null);

  useEffect(() => {
    loadSubjects();
  }, []);

  // Load all subjects
  const loadSubjects = async () => {
    try {
      const res = await axios.get(`${API}/api/cbt/subjects`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSubjects(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // Create new subject
  const createSubject = async () => {
    if (!sname || !sslug) return alert("Name & slug required");
    try {
      await axios.post(
        `${API}/api/admin/cbt/subjects`,
        { name: sname, slug: sslug, maxQuestions: smax, defaultTime: stime },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSname("");
      setSslug("");
      setSmax(100);
      setStime(30);
      loadSubjects();
    } catch (err) {
      console.error(err);
      alert("Failed to create subject");
    }
  };

  // Select subject and load questions
  const selectSubject = async (s) => {
    setSelSubject(s);
    try {
      const res = await axios.get(
        `${API}/api/admin/cbt/questions?subjectId=${s.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setQuestions(res.data);
    } catch (err) {
      console.error(err);
      setQuestions([]);
    }
  };

  // Create single question
  const createQuestion = async () => {
    if (!selSubject) return alert("Choose subject");
    const form = new FormData();
    form.append("subjectId", selSubject.id);
    form.append("text", qText);
    form.append("optionA", optA);
    form.append("optionB", optB);
    form.append("optionC", optC);
    form.append("optionD", optD);
    form.append("correct", correct);
    form.append("explanation", explanation);
    if (image) form.append("image", image);

    try {
      await axios.post(`${API}/api/admin/cbt/questions`, form, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      setQText("");
      setOptA("");
      setOptB("");
      setOptC("");
      setOptD("");
      setCorrect("A");
      setExplanation("");
      setImage(null);
      selectSubject(selSubject);
    } catch (err) {
      console.error(err);
      alert("Failed to add question");
    }
  };

  // Delete question
  const removeQuestion = async (id) => {
    if (!confirm("Delete question?")) return;
    try {
      await axios.delete(`${API}/api/admin/cbt/questions/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      selectSubject(selSubject);
    } catch (err) {
      console.error(err);
      alert("Failed to delete question");
    }
  };

  // Bulk upload questions
  const bulkUploadQuestions = async () => {
    if (!selSubject) return alert("Choose a subject first");
    if (!bulkFile) return alert("Select a CSV or JSON file");

    const form = new FormData();
    form.append("file", bulkFile);
    form.append("subjectId", selSubject.id);

    try {
     const res = await axios.post(
  `${API}/api/admin/cbt/questions/bulk-upload`,
  form,
  {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "multipart/form-data",
    },
  }
);

      alert(`Uploaded ${res.data.inserted} questions successfully`);
      setBulkFile(null);
      selectSubject(selSubject);
    } catch (err) {
      console.error(err);
      alert("Upload failed");
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">CBT Manager (Admin)</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Subjects Panel */}
        <div className="col-span-1">
          <h3 className="font-semibold mb-2">Subjects</h3>
          <div className="space-y-2">
            {subjects.map((s) => (
              <div
                key={s.id}
                className="p-2 border rounded flex justify-between items-center"
              >
                <div>
                  <div className="font-medium">{s.name}</div>
                  <div className="text-xs text-gray-500">
                    Max {s.maxQuestions} • {s.defaultTime} mins
                  </div>
                </div>
                <button
                  onClick={() => selectSubject(s)}
                  className="px-2 py-1 bg-green-700 text-white rounded"
                >
                  Open
                </button>
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 border rounded">
            <h4 className="font-semibold mb-2">Create Subject</h4>
            <input
              placeholder="Name"
              value={sname}
              onChange={(e) => setSname(e.target.value)}
              className="w-full p-2 border rounded mb-2"
            />
            <input
              placeholder="Slug"
              value={sslug}
              onChange={(e) => setSslug(e.target.value)}
              className="w-full p-2 border rounded mb-2"
            />
            <div className="flex gap-2">
              <input
                type="number"
                value={smax}
                onChange={(e) => setSmax(e.target.value)}
                className="p-2 border rounded w-1/2"
              />
              <input
                type="number"
                value={stime}
                onChange={(e) => setStime(e.target.value)}
                className="p-2 border rounded w-1/2"
              />
            </div>
            <button
              onClick={createSubject}
              className="mt-2 bg-green-700 text-white px-3 py-2 rounded"
            >
              Create
            </button>
          </div>
        </div>

        {/* Questions Panel */}
        <div className="md:col-span-2">
          {selSubject ? (
            <>
              <div className="mb-3 flex justify-between items-center">
                <h3 className="font-semibold">{selSubject.name} - Questions</h3>
                <div>{questions.length} questions</div>
              </div>

              {/* Bulk Upload */}
              <div className="p-3 border rounded mb-4 bg-blue-50">
                <h4 className="font-semibold mb-2 text-blue-700">
                  Bulk Upload Questions
                </h4>

                <input
                  type="file"
                  accept=".csv,.json"
                  onChange={(e) => setBulkFile(e.target.files[0])}
                  className="w-full p-2 border rounded mb-2"
                />

                <button
                  onClick={bulkUploadQuestions}
                  className="bg-blue-700 text-white px-3 py-2 rounded"
                >
                  Upload CSV / JSON
                </button>

                <p className="text-xs text-gray-600 mt-2">
                  Supported formats: <strong>.csv</strong> or{" "}
                  <strong>.json</strong>
                  <br />
                  CSV must contain: question, optionA, optionB, optionC, optionD,
                  correctAnswer, explanation
                </p>
              </div>

              {/* Add Single Question */}
              <div className="p-3 border rounded mb-4">
                <h4 className="font-semibold mb-2">Add Question</h4>
                <textarea
                  placeholder="Question text"
                  value={qText}
                  onChange={(e) => setQText(e.target.value)}
                  className="w-full p-2 border rounded mb-2"
                  rows={3}
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    placeholder="Option A"
                    value={optA}
                    onChange={(e) => setOptA(e.target.value)}
                    className="p-2 border rounded"
                  />
                  <input
                    placeholder="Option B"
                    value={optB}
                    onChange={(e) => setOptB(e.target.value)}
                    className="p-2 border rounded"
                  />
                  <input
                    placeholder="Option C"
                    value={optC}
                    onChange={(e) => setOptC(e.target.value)}
                    className="p-2 border rounded"
                  />
                  <input
                    placeholder="Option D"
                    value={optD}
                    onChange={(e) => setOptD(e.target.value)}
                    className="p-2 border rounded"
                  />
                </div>

                <div className="mt-2 flex items-center gap-2">
                  <select
                    value={correct}
                    onChange={(e) => setCorrect(e.target.value)}
                    className="p-2 border rounded"
                  >
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                  </select>
                  <input
                    type="file"
                    onChange={(e) => setImage(e.target.files[0])}
                  />
                </div>

                <textarea
                  placeholder="Explanation (optional)"
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  className="w-full p-2 border rounded mt-2"
                  rows={2}
                />
                <div className="mt-2">
                  <button
                    onClick={createQuestion}
                    className="bg-green-700 text-white px-3 py-2 rounded"
                  >
                    Add Question
                  </button>
                </div>
              </div>

              {/* Questions List */}
              <div>
                {questions.map((q) => (
                  <div
                    key={q.id}
                    className="p-3 border rounded mb-2 flex justify-between"
                  >
                    <div>
                      <div className="font-medium">{q.text}</div>
                      <div className="text-xs text-gray-500">Correct: {q.correct}</div>
                    </div>
                    <div>
                      <button
                        onClick={() => removeQuestion(q.id)}
                        className="px-2 py-1 bg-red-600 text-white rounded"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="p-6 text-gray-500">
              Open a subject to manage questions.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
