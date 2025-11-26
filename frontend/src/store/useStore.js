import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useStore = create(
    persist(
        (set) => ({
            savedArticles: [],
            saveArticle: (article) => set((state) => {
                if (state.savedArticles.some(a => a.url === article.url)) return state;
                return { savedArticles: [...state.savedArticles, article] };
            }),
            removeArticle: (url) => set((state) => ({
                savedArticles: state.savedArticles.filter((a) => a.url !== url)
            })),
        }),
        {
            name: 'perspective-bridge-storage',
        }
    )
);
