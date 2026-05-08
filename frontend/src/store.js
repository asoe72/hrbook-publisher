import { create } from 'zustand';

const useStore = create((set) => ({

	// local source-path .md
	pathMd: '',
	setPathMd: (val) => set({ pathMd: val })
}));

export { useStore };
