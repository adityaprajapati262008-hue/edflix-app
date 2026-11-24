export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
}

export interface CourseModule {
  id: number;
  title: string;
  summary: string;
  searchQuery: string;
  keyTakeaways: string[];
  videoId: string;
  channelTitle: string;
  thumbnail: string;
  quiz: QuizQuestion[];
  completed?: boolean;
  unlocked?: boolean;
}

export interface Course {
  id: string;
  topic: string;
  level: string;
  duration: string;
  description: string;
  createdAt: string;
  modules: CourseModule[];
}
