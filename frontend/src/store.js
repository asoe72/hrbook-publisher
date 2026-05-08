import { create } from 'zustand';

const useStore = create((set) => ({

	// app-version
	version: '...',
	setVersion: (val) => set({ version: val }),

	// local source-path .md
	pathMd: '',
	setPathMd: (val) => set({ pathMd: val }),

	// 현재 선택된 제어기 모델
	contModel: 'Hi6',
	setContModel: (val) => set({ contModel: val })
}));

export { useStore };
