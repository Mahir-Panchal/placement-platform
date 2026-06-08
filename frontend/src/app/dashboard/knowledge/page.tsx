'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import api from '@/lib/api';

interface Document {
    id: string;
    title: string;
    chunk_count: number;
    status: 'PENDING' | 'INDEXING' | 'READY' | 'FAILED';
    created_at: string;
}

export default function KnowledgePage() {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [uploading, setUploading] = useState(false);
    const [title, setTitle] = useState('');
    const [question, setQuestion] = useState('');
    const [selectedDocId, setSelectedDocId] = useState('');
    const [answer, setAnswer] = useState('');
    const [sources, setSources] = useState<string[]>([]);
    const [querying, setQuerying] = useState(false);
    const [error, setError] = useState('');
    const [dragOver, setDragOver] = useState(false);

    const loadDocuments = async () => {
        try {
            const res = await api.get('/api/rag/documents/');
            setDocuments(res.data);
        } catch { }
    };

    useEffect(() => {
        loadDocuments();
    }, []);

    // Poll indexing documents
    useEffect(() => {
        const indexing = documents.filter(
            d => d.status === 'PENDING' || d.status === 'INDEXING'
        );
        if (indexing.length === 0) return;
        const interval = setInterval(loadDocuments, 3000);
        return () => clearInterval(interval);
    }, [documents]);

    const handleUpload = async (file: File) => {
        if (!title.trim()) {
            setError('Please enter a title first');
            return;
        }
        if (!file.name.endsWith('.pdf')) {
            setError('Only PDF files allowed');
            return;
        }
        setError('');
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('title', title);
            await api.post('/api/rag/upload/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setTitle('');
            await loadDocuments();
        } catch (err: any) {
            setError(err.response?.data?.file?.[0] || 'Upload failed');
        } finally {
            setUploading(false);
        }
    };

    const handleQuery = async () => {
        if (!selectedDocId || !question.trim()) {
            setError('Select a document and enter a question');
            return;
        }
        setError('');
        setQuerying(true);
        setAnswer('');
        setSources([]);
        try {
            const res = await api.post('/api/rag/query/', {
                document_id: selectedDocId,
                question,
            });
            setAnswer(res.data.answer);
            setSources(res.data.sources || []);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Query failed');
        } finally {
            setQuerying(false);
        }
    };

    const handleDelete = async (id: string) => {
        await api.delete(`/api/rag/documents/${id}/`);
        setDocuments(prev => prev.filter(d => d.id !== id));
        if (selectedDocId === id) setSelectedDocId('');
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file) handleUpload(file);
    }, [title]);

    const readyDocs = documents.filter(d => d.status === 'READY');

    return (
        <div className="min-h-screen bg-gray-950 text-white">
            <nav className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
                <Link href="/dashboard" className="text-xl font-bold text-violet-400">PlacementAI</Link>
                <Link href="/dashboard" className="text-gray-400 hover:text-white text-sm transition">← Dashboard</Link>
            </nav>

            <main className="max-w-3xl mx-auto px-6 py-10">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold">Knowledge Base</h1>
                    <p className="text-gray-400 mt-1">Upload PDFs and ask questions about them</p>
                </div>

                {/* Upload Section */}
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-8">
                    <h2 className="text-lg font-semibold mb-4">Upload Document</h2>
                    <div className="space-y-3">
                        <input
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="Document title (e.g. DSA Notes, Company FAQ)"
                            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 transition"
                        />
                        <div
                            onDrop={handleDrop}
                            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                            onDragLeave={() => setDragOver(false)}
                            className={`border-2 border-dashed rounded-xl p-8 text-center transition ${dragOver ? 'border-violet-500 bg-violet-500/5' : 'border-gray-700'
                                }`}
                        >
                            <p className="text-gray-400 mb-3">Drop PDF here or</p>
                            <label className={`cursor-pointer px-4 py-2 rounded-lg text-sm font-medium transition ${uploading ? 'bg-gray-700 text-gray-400' : 'bg-violet-600 hover:bg-violet-700 text-white'
                                }`}>
                                {uploading ? 'Uploading...' : 'Choose File'}
                                <input
                                    type="file"
                                    accept=".pdf"
                                    className="hidden"
                                    disabled={uploading}
                                    onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0])}
                                />
                            </label>
                        </div>
                        {error && <p className="text-red-400 text-sm">{error}</p>}
                    </div>
                </div>

                {/* Documents List */}
                {documents.length > 0 && (
                    <div className="mb-8">
                        <h2 className="text-lg font-semibold mb-4">Your Documents</h2>
                        <div className="space-y-3">
                            {documents.map(doc => (
                                <div key={doc.id}
                                    className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">📄</span>
                                        <div>
                                            <p className="text-white font-medium">{doc.title}</p>
                                            <p className="text-gray-500 text-xs mt-0.5">
                                                {doc.status === 'READY'
                                                    ? `${doc.chunk_count} chunks indexed`
                                                    : doc.status === 'INDEXING' ? 'Indexing...'
                                                        : doc.status === 'PENDING' ? 'Waiting...'
                                                            : 'Failed'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={`text-xs px-2 py-1 rounded-full ${doc.status === 'READY' ? 'bg-green-500/15 text-green-400' :
                                            doc.status === 'INDEXING' || doc.status === 'PENDING'
                                                ? 'bg-amber-500/15 text-amber-400' :
                                                'bg-red-500/15 text-red-400'
                                            }`}>
                                            {doc.status === 'INDEXING' || doc.status === 'PENDING' ? (
                                                <span className="flex items-center gap-1">
                                                    <span className="w-2 h-2 border border-amber-400 border-t-transparent rounded-full animate-spin inline-block" />
                                                    {doc.status}
                                                </span>
                                            ) : doc.status}
                                        </span>
                                        <button
                                            onClick={() => handleDelete(doc.id)}
                                            className="text-red-400 hover:text-red-300 text-sm transition"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Query Section */}
                {readyDocs.length > 0 && (
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                        <h2 className="text-lg font-semibold mb-4">Ask a Question</h2>
                        <div className="space-y-3">
                            <select
                                value={selectedDocId}
                                onChange={e => setSelectedDocId(e.target.value)}
                                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500 transition"
                            >
                                <option value="">Select a document</option>
                                {readyDocs.map(doc => (
                                    <option key={doc.id} value={doc.id}>{doc.title}</option>
                                ))}
                            </select>

                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={question}
                                    onChange={e => setQuestion(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleQuery()}
                                    placeholder="Ask anything about the document..."
                                    className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 transition"
                                />
                                <button
                                    onClick={handleQuery}
                                    disabled={querying}
                                    className="px-5 py-3 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded-xl transition font-medium"
                                >
                                    {querying ? '...' : 'Ask'}
                                </button>
                            </div>

                            {answer && (
                                <div className="bg-gray-800 rounded-xl p-4 mt-2">
                                    <p className="text-violet-400 text-xs font-medium mb-2">Answer</p>
                                    <p className="text-gray-200 text-sm leading-relaxed">{answer}</p>
                                    {sources.length > 0 && (
                                        <div className="mt-3 pt-3 border-t border-gray-700">
                                            <p className="text-gray-500 text-xs mb-2">Sources used:</p>
                                            {sources.map((src, i) => (
                                                <p key={i} className="text-gray-500 text-xs mb-1 truncate">{src}...</p>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {documents.length === 0 && (
                    <div className="text-center py-12 text-gray-600">
                        <div className="text-5xl mb-3">📚</div>
                        <p>No documents yet — upload a PDF above!</p>
                    </div>
                )}
            </main>
        </div>
    );
}