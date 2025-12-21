// src/components/CBTPage.jsx - FIXED VERSION
import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";

const API = import.meta.env.VITE_BACKEND_URL;

export default function CBTPage() {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const navigate = useNavigate();

  // UI states
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [numQuestions, setNumQuestions] = useState(20);
  const [timeMins, setTimeMins] = useState(30);
  const [allowCustom, setAllowCustom] = useState(true);

  // test states
  const [questions, setQuestions] = useState([]);
  const [questionOrder, setQuestionOrder] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [marked, setMarked] = useState({});
  const [running, setRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  // ==============================
  // 🔥 FIXED: CHECK PROMO FIRST, THEN SUBSCRIPTION
  // ==============================
  useEffect(() => {
    const verifyAccess = async () => {
      if (!token) {
        alert("You must log in first.");
        navigate("/login");
        return;
      }

      try {
        // ✅ STEP 1: Check if promo is active
        const promoRes = await axios.get(`${API}/api/promo/status`);

        if (promoRes.data.active) {
          // 🎉 Promo is active - everyone gets access!
          console.log("✅ Free promo active:", promoRes.data.message);
          
          // Load subjects
          const subjectsRes = await axios.get(`${API}/api/cbt/subjects`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setSubjects(subjectsRes.data);
          return;
        }

        // ✅ STEP 2: Promo ended - check subscription
        const subRes = await axios.get(`${API}/api/subscription/status`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!subRes.data.active) {
          alert("Free access period has ended. Please subscribe to access CBT.");
          navigate("/subscribe");
          return;
        }

        // Load subjects
        const subjectsRes = await axios.get(`${API}/api/cbt/subjects`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSubjects(subjectsRes.data);

      } catch (err) {
        console.error("Access check error:", err);
        alert("Error checking access. Please try again.");
        navigate("/subscribe");
      }
    };

    verifyAccess();
  }, [token, navigate]);

  // ... REST OF YOUR CODE STAYS EXACTLY THE SAME ...
  
  // open settings (before starting)
  const openSettings = (subject) => {
    setSelectedSubject(subject);
    setNumQuestions(Math.min(subject.maxQuestions || 20, 20));
    setTimeMins(subject.defaultTime || 30);
    setAllowCustom(!!subject.allowCustom);
    setSettingsOpen(true);
  };

  // start test: fetch questions
  const startTest = async () => {
    if (!selectedSubject) return;
    try {
      const res = await axios.get(
        `${API}/api/cbt/subjects/${selectedSubject.id}/questions?num=${numQuestions}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setQuestions(res.data.questions);
      setQuestionOrder(res.data.questionOrder);
      setCurrentIdx(0);
      setAnswers({});
      setMarked({});
      setRunning(true);
      setResult(null);
      setSettingsOpen(false);

      // start timer
      const secs = (Number(timeMins) || 30) * 60;
      setTimeLeft(secs);
      if (timerRef.current) clearInterval(timerRef.current);

      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      console.error(err);
      alert("Failed to load questions");
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleAnswer = (qid, choice) => {
    setAnswers((prev) => ({ ...prev, [qid]: choice }));
  };

  const toggleMark = (qid) => {
    setMarked((prev) => ({ ...prev, [qid]: !prev[qid] }));
  };

  const goto = (idx) => {
    if (idx < 0 || idx >= questions.length) return;
    setCurrentIdx(idx);
  };

  const handleSubmit = async () => {
    if (!window.confirm("Submit test?")) return;
    await submitAnswers();
  };

  const handleAutoSubmit = async () => {
    if (submitting) return;
    alert("Time is up – auto-submitting your answers.");
    await submitAnswers();
  };

  const submitAnswers = async () => {
    setSubmitting(true);
    try {
      const payload = {
        subjectId: selectedSubject.id,
        questionOrder,
        answers,
        durationMins:
          (Number(timeMins) || 30) - Math.floor(timeLeft / 60),
        numQuestions: questionOrder.length,
      };

      const res = await axios.post(
        `${API}/api/cbt/submit`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setResult(res.data);
      setRunning(false);
      if (timerRef.current) clearInterval(timerRef.current);

      const full = await axios.get(
        `${API}/api/cbt/results/${res.data.resultId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setResult((prev) => ({
        ...prev,
        review: full.data.review,
        meta: full.data.result,
      }));
    } catch (err) {
      console.error(err);
      alert("Submit failed");
    }
    setSubmitting(false);
  };

  // =============================
  // SUBJECT LIST SCREEN
  // =============================
  if (!selectedSubject) {
    return (
      <div className="p-6 bg-white rounded shadow">
        <h2 className="text-2xl font-bold mb-4">Choose a CBT Subject</h2>

        <div className="grid sm:grid-cols-2 gap-4">
          {subjects.map((s) => (
            <div
              key={s.id}
              className="p-4 border rounded flex justify-between items-center"
            >
              <div>
                <div className="font-semibold">{s.name}</div>
                <div className="text-xs text-gray-500">{s.description}</div>
                <div className="text-xs text-gray-400 mt-1">
                  Max Qs: {s.maxQuestions} • Default: {s.defaultTime} mins
                </div>
              </div>
              <button
                onClick={() => openSettings(s)}
                className="bg-green-700 text-white px-4 py-2 rounded"
              >
                Start
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={() => navigate("/history")}
          className="mt-6 px-4 py-2 bg-blue-600 text-white rounded"
        >
          View Test History
        </button>
      </div>
    );
  }

  // =============================
  // RUNNING TEST SCREEN
  // =============================
  if (running) {
    const q = questions[currentIdx];
    const seconds = timeLeft % 60;
    const minutes = Math.floor(timeLeft / 60);

    return (
      <div className="p-4 grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Left */}
        <div className="lg:col-span-3 bg-white p-6 rounded shadow">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-semibold">
                Question {currentIdx + 1} / {questions.length}
              </h3>
              <p className="text-sm text-gray-500">
                Subject: {selectedSubject.name}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Time left</p>
              <p className="text-xl font-mono">
                {String(minutes).padStart(2, "0")}:
                {String(seconds).padStart(2, "0")}
              </p>
            </div>
          </div>

          <div className="mb-4">
            <p className="text-lg font-medium mb-2">{q.text}</p>

            {q.imageUrl && (
              <img
                src={`${API}${q.imageUrl}`}
                alt="q"
                className="max-h-64 object-contain mb-3"
              />
            )}

            <div className="grid gap-2">
              {["optionA", "optionB", "optionC", "optionD"].map(
                (opt, i) => {
                  const letter = ["A", "B", "C", "D"][i];
                  const selected = answers[q.id] === letter;

                  return (
                    <button
                      key={opt}
                      onClick={() => handleAnswer(q.id, letter)}
                      className={`text-left px-4 py-3 rounded border ${
                        selected
                          ? "bg-orange-600 text-white"
                          : "bg-gray-50 hover:bg-gray-100"
                      }`}
                    >
                      <strong className="mr-3">{letter}.</strong>
                      {q[opt]}
                    </button>
                  );
                }
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => goto(currentIdx - 1)}
              disabled={currentIdx === 0}
              className="px-4 py-2 bg-gray-100 rounded disabled:opacity-50"
            >
              <ArrowLeft />
            </button>

            <button
              onClick={() => goto(currentIdx + 1)}
              disabled={currentIdx === questions.length - 1}
              className="px-4 py-2 bg-gray-100 rounded disabled:opacity-50"
            >
              <ArrowRight />
            </button>

            <button
              onClick={() => toggleMark(q.id)}
              className={`ml-4 px-3 py-2 rounded ${
                marked[q.id] ? "bg-yellow-400" : "bg-gray-100"
              }`}
            >
              {marked[q.id] ? "Unmark" : "Mark"}
            </button>

            <button
              onClick={handleSubmit}
              className="ml-auto bg-green-700 text-white px-4 py-2 rounded"
            >
              Submit
            </button>
          </div>
        </div>

        {/* Right */}
        <div className="bg-white p-4 rounded shadow">
          <h4 className="font-semibold mb-2">Questions</h4>
          <div className="grid grid-cols-5 gap-2">
            {questions.map((qq, idx) => {
              const answered = !!answers[qq.id];
              const isMarked = !!marked[qq.id];
              const active = idx === currentIdx;

              return (
                <button
                  key={qq.id}
                  onClick={() => goto(idx)}
                  className={`p-2 rounded ${
                    active
                      ? "ring-2 ring-orange-400"
                      : answered
                      ? "bg-green-100"
                      : "bg-gray-100"
                  } ${isMarked ? "border-2 border-yellow-400" : ""}`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          <div className="mt-4 text-sm text-gray-600">
            <p>
              <strong>Answered:</strong> {Object.keys(answers).length}
            </p>
            <p>
              <strong>Marked:</strong>
              {Object.keys(marked).filter((k) => marked[k]).length}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // =============================
  // SHOW RESULT AFTER SUBMISSION
  // =============================
  if (result && result.review) {
    return (
      <div className="p-6 bg-white rounded shadow">
        <h2 className="text-2xl font-bold mb-4">Your Result</h2>

        <p className="text-lg">
          <strong>Score:</strong> {result.score} / {result.total}
        </p>
        <p className="text-lg">
          <strong>Percentage:</strong> {result.percentage}%
        </p>
        <p>
          <strong>Duration:</strong> {result.meta.durationMins} minutes
        </p>

        <h3 className="text-xl font-bold mt-6 mb-2">Review Questions</h3>
        <div className="space-y-4">
          {result.review.map((q, idx) => {
            const userAns = q.given || "No answer";
            const correct = q.correct;
            const isCorrect = userAns === correct;

            return (
              <div key={q.id} className="border p-4 rounded">
                <p className="font-semibold mb-1">
                  {idx + 1}. {q.text}
                </p>

                <p>
                  <strong>Your Answer:</strong>{" "}
                  <span
                    className={isCorrect ? "text-green-700" : "text-red-600"}
                  >
                    {userAns}
                  </span>
                </p>

                {!isCorrect && (
                  <p>
                    <strong>Correct Answer:</strong>{" "}
                    <span className="text-blue-700">{correct}</span>
                  </p>
                )}

                <p className="text-gray-700">
                  <strong>Explanation:</strong> {q.explanation}
                </p>
              </div>
            );
          })}
        </div>

        <button
          onClick={() => window.location.reload()}
          className="mt-6 px-6 py-3 bg-green-700 text-white rounded"
        >
          Take Another Test
        </button>
      </div>
    );
  }

  // =============================
  // SETTINGS SCREEN (BEFORE TEST)
  // =============================
  return (
    <div className="p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-4">
        Start CBT - {selectedSubject.name}
      </h2>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-700">
            Number of questions
          </label>
          <input
            type="number"
            min={1}
            max={selectedSubject.maxQuestions || 200}
            value={numQuestions}
            onChange={(e) => setNumQuestions(e.target.value)}
            className="border p-2 rounded w-full"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-700">Time (minutes)</label>
          <input
            type="number"
            min={1}
            max={240}
            value={timeMins}
            onChange={(e) => setTimeMins(e.target.value)}
            className="border p-2 rounded w-full"
          />
        </div>
      </div>

      <div className="mt-4">
        <button
          onClick={startTest}
          className="bg-green-700 text-white px-4 py-2 rounded"
        >
          Start Test
        </button>

        <button
          onClick={() => setSelectedSubject(null)}
          className="ml-2 px-4 py-2 border rounded"
        >
          Back
        </button>
      </div>
    </div>
  );
}