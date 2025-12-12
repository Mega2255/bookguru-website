// Pastquestion.jsx
import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, Search, BookOpen, Download, ExternalLink, X } from 'lucide-react';
import { useNavigate } from "react-router-dom";
import axios from "axios";

/* ------------------------------------------------------
   FILTER OPTIONS
-------------------------------------------------------*/
const EXAMS = [
    { id: 'jamb', name: 'JAMB UTME' },
    { id: 'waec', name: 'WAEC May/June' },
    { id: 'neco', name: 'NECO SSCE' },
];

const SUBJECTS = [
    { id: 'math', name: 'Mathematics' },
    { id: 'eng', name: 'English Language' },
    { id: 'phys', name: 'Physics' },
    { id: 'chem', name: 'Chemistry' },
    { id: 'bio', name: 'Biology' },
    { id: 'econ', name: 'Economics' },
    { id: 'govt', name: 'Government' },
    { id: 'lit', name: 'Literature in English' },
    { id: 'crk', name: 'CRK' },
    { id: 'com', name: 'Commerce' },
];

/* ------------------------------------------------------
   PAST QUESTIONS DATA
-------------------------------------------------------*/
const PAST_QUESTION_DATA = [
    { examId: 'jamb', subjectId: 'eng', year: 2023, name: 'English Language (JAMB)',
      pdfLink: 'https://docs.google.com/document/d/1-AUZWyVxGp154mRwoVzr4HqrRXZ17mNV/edit?usp=drive_link' },

    { examId: 'jamb', subjectId: 'math', year: 2023, name: 'Mathematics (JAMB)',
      pdfLink: 'https://docs.google.com/document/d/1-Mbsj_Je2M3iD-3e79lZhl-uStJIIZvV/edit?usp=sharing' },

    { examId: 'jamb', subjectId: 'com', year: 2022, name: 'Commerce (JAMB)',
      pdfLink: 'https://docs.google.com/document/d/1-6bom4HNF3isS2Dur2McH6fHmmcFBxk4/edit?usp=drive_link' },

    { examId: 'jamb', subjectId: 'chem', year: 2023, name: 'Chemistry (JAMB)',
      pdfLink: 'https://docs.google.com/document/d/1-6M-ylJaS3RlNf8C6ckiDIo5b_OLoyt3/edit?usp=drive_link' },

    { examId: 'jamb', subjectId: 'bio', year: 2023, name: 'Biology (JAMB)',
      pdfLink: 'https://docs.google.com/document/d/1-2hESzSuvDM64UQSIJuBXAyg24wqCBrR/edit?usp=sharing' },

    { examId: 'jamb', subjectId: 'govt', year: 2023, name: 'Government (JAMB)',
      pdfLink: 'https://docs.google.com/document/d/1-Lxc946LhMWJ_99G7-DM9lrF6plXyu4j/edit?usp=drive_link' },

    { examId: 'jamb', subjectId: 'econ', year: 2023, name: 'Economics (JAMB)',
      pdfLink: 'https://docs.google.com/document/d/1-A8QGcVCYN5_QjS5DsHSvUN3c0WSlysM/edit?usp=drive_link' },

    { examId: 'jamb', subjectId: 'phys', year: 2023, name: 'Physics (JAMB)',
      pdfLink: 'https://docs.google.com/document/d/1-ciu-5rskNTzHJCcfn5jRtNZweAu4bWY/edit?usp=drive_link' },

    // WAEC
    { examId: 'waec', subjectId: 'eng', year: 2021, name: 'English Language (WAEC)',
      pdfLink: 'https://drive.google.com/file/d/1FpJ4w-cVjQWkWz6VAbGtEuF-LsBsWXIy/view?usp=drive_link' },

    { examId: 'waec', subjectId: 'bio', year: 2022, name: 'Biology 2022 (WAEC)',
      pdfLink: 'https://drive.google.com/file/d/13aHaFS8yWhYevPsXkArFR7TLygh8ZKvd/view?usp=drive_link' },

    { examId: 'waec', subjectId: 'chem', year: 2023, name: 'Chemistry (WAEC)',
      pdfLink: 'https://drive.google.com/file/d/1hGxl0eLmNp3ejrFbVt5hecgLSkatOCxR/view?usp=drive_link' },

    // NECO
    { examId: 'neco', subjectId: 'econ', year: 2020, name: 'Economics 2020 (NECO)',
      pdfLink: 'REPLACE_LINK' },

    { examId: 'neco', subjectId: 'lit', year: 2021, name: 'Literature 2021 (NECO)',
      pdfLink: 'REPLACE_LINK' },
];

/* ------------------------------------------------------
   MAIN COMPONENT — FIXED + STABLE HOOK ORDER
-------------------------------------------------------*/
export default function Pastquestion() {
    const navigate = useNavigate();

    // ---- REQUIRED HOOKS FOR ACCESS CONTROL ----
    const [loading, setLoading] = useState(true);
    const [allowed, setAllowed] = useState(false);

    // ---- YOUR ORIGINAL UI HOOKS ----
    const [selectedExam, setSelectedExam] = useState(EXAMS[0].id);
    const [selectedSubject, setSelectedSubject] = useState(SUBJECTS[0].id);
    const [searchQuery, setSearchQuery] = useState('');
    const [isFilterOpen, setIsFilterOpen] = useState(true);


    // ---- FILTER LOGIC ----
    const filteredQuestions = useMemo(() => {
        return PAST_QUESTION_DATA.filter(q =>
            q.examId === selectedExam &&
            q.subjectId === selectedSubject &&
            (q.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                String(q.year).includes(searchQuery))
        );
    }, [selectedExam, selectedSubject, searchQuery]);

    // ---- SUBSCRIPTION CHECK (NO EARLY RETURN) ----
    useEffect(() => {
        const check = async () => {
            try {
                const token = localStorage.getItem("token");
                if (!token) return navigate("/login");

                const res = await axios.get(
                    "http://localhost:5000/api/subscription/status",
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                if (res.data.active) {
                    setAllowed(true);
                } else {
                    navigate("/subscribe");
                }
            } catch (err) {
                navigate("/subscribe");
            }

            setLoading(false);
        };

        check();
    }, []);

    // ---- LOADING STATE ----
    if (loading) {
        return (
            <div className="p-10 text-center text-green-700 font-semibold">
                Checking subscription...
            </div>
        );
    }

    // ---- IF NOT ALLOWED, REDIRECTING ----
    if (!allowed) return null;

    /* ------------------------------------------------------
       OPEN PDF
    -------------------------------------------------------*/
    const handleOpenPdf = (link) => {
        if (link.startsWith('REPLACE')) {
            alert("⚠️ This paper link has not been updated yet.");
            return;
        }
        window.open(link, '_blank');
    };

    /* SMALL BUTTON COMPONENT */
    const FilterButton = ({ id, name, currentId, onClick }) => (
        <button
            onClick={() => onClick(id)}
            className={`
                px-4 py-2 text-sm font-medium rounded-full transition
                ${currentId === id
                    ? 'bg-orange-600 text-white shadow-md'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'}
            `}
        >
            {name}
        </button>
    );

    /* ------------------------------------------------------
       FULL PAGE UI (UNCHANGED)
    -------------------------------------------------------*/
    return (
        <section className="min-h-screen py-10 bg-gray-50">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
                className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8"
            >

                <h1 className="text-4xl font-extrabold text-green-800 mb-2">
                    Past Questions Library
                </h1>
                <p className="text-gray-600 text-lg mb-8">
                    Access verified past questions and open them instantly.
                </p>

                <div className="bg-white rounded-2xl shadow-xl p-6 lg:p-8">

                    {/* Search + Filter */}
                    <div className="flex flex-col md:flex-row gap-4 mb-6">
                        <div className="relative flex-grow">
                            <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by name or year..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-green-600 focus:border-green-600"
                            />
                        </div>

                        <button
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                            className="flex items-center justify-center gap-2 px-4 py-3 bg-green-700 text-white rounded-xl font-medium hover:bg-green-800 md:w-40"
                        >
                            <Filter size={18} />
                            {isFilterOpen ? 'Close Filters' : 'Filter'}
                        </button>
                    </div>

                    <AnimatePresence>
                        {isFilterOpen && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden mb-6 p-4 border rounded-xl bg-gray-50"
                            >
                                {/* Exam Filter */}
                                <div className="mb-4">
                                    <h3 className="text-lg font-bold text-green-700 mb-3">Select Exam</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {EXAMS.map(exam => (
                                            <FilterButton
                                                key={exam.id}
                                                id={exam.id}
                                                name={exam.name}
                                                currentId={selectedExam}
                                                onClick={setSelectedExam}
                                            />
                                        ))}
                                    </div>
                                </div>

                                {/* Subject Filter */}
                                <div className="mt-4 pt-4 border-t">
                                    <h3 className="text-lg font-bold text-green-700 mb-3">Select Subject</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {SUBJECTS.map(subject => (
                                            <FilterButton
                                                key={subject.id}
                                                id={subject.id}
                                                name={subject.name}
                                                currentId={selectedSubject}
                                                onClick={setSelectedSubject}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Results */}
                    <h2 className="text-2xl font-bold text-green-700 mb-4 flex items-center gap-2">
                        <BookOpen size={26} className="text-orange-600" />
                        Available Papers
                    </h2>

                    {filteredQuestions.length > 0 ? (
                        <div className="grid gap-3">
                            {filteredQuestions.map((q, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                >
                                    <button
                                        onClick={() => handleOpenPdf(q.pdfLink)}
                                        className="w-full p-5 rounded-xl border bg-white hover:bg-green-50 transition flex justify-between items-center shadow-md hover:shadow-lg"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-orange-100 text-orange-600 rounded-lg">
                                                <Download size={24} />
                                            </div>

                                            <div>
                                                <span className="text-sm font-semibold text-green-700">
                                                    {EXAMS.find(e => e.id === q.examId)?.name} - {q.year}
                                                </span>
                                                <p className="text-lg font-medium text-gray-800">{q.name}</p>

                                                <p className="text-xs text-red-500 mt-1">
                                                    {q.pdfLink.startsWith('REPLACE')
                                                        ? '⚠️ Placeholder link — update required'
                                                        : 'Click to open PDF'}
                                                </p>
                                            </div>
                                        </div>

                                        <ExternalLink size={22} className="text-orange-600" />
                                    </button>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center p-12 bg-gray-50 border rounded-xl">
                            <X size={40} className="mx-auto text-red-400" />
                            <h3 className="mt-3 text-xl font-semibold">No Questions Found</h3>
                            <p className="mt-1 text-gray-500">
                                Try another subject or exam type.
                            </p>
                        </div>
                    )}
                </div>
            </motion.div>
        </section>
    );
}
