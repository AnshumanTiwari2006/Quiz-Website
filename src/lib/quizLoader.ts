export interface Quiz {
    id: string;
    title: string;
    type: string;
    timer: number;
    questionCount: number;
    questions?: any[];
    class?: string;
    subject?: string;
    teacherName?: string;
    createdAt?: any;
    image?: string;
    level?: string;
    teacherPhoto?: string;
}

export const fetchQuizzes = async (): Promise<Quiz[]> => {
    try {
        const response = await fetch('/quizzes.json');
        if (!response.ok) {
            throw new Error('Failed to fetch quizzes');
        }
        const data = await response.json();
        return data.quizzes;
    } catch (error) {
        console.error('Error loading static quizzes:', error);
        return [];
    }
};

export const getQuizById = async (id: string): Promise<Quiz | null> => {
    const quizzes = await fetchQuizzes();
    const staticQuiz = quizzes.find(q => q.id === id);

    if (staticQuiz) return staticQuiz;

    // Fallback to localStorage for admin-created quizzes
    const stored = localStorage.getItem('quizzes');
    if (stored) {
        const localQuizzes = JSON.parse(stored);
        return localQuizzes.find((q: any) => q.id === id) || null;
    }

    return null;
};
