import { create } from 'zustand';

const useStore = create((set) => ({

	// app-version
	appVersion: '...',
	setAppVersion: (val) => set({ appVersion: val }),

	// source-type ('local'|'remote')
	sourceType: 'local',
	setSourceType: (val) => set({ sourceType: val }),

	// local source-path .md
	pathMd: '',
	setPathMd: (val) => set({ pathMd: val }),

	// remote book
	bookId: 'doc-endless',
	setBookId: (val) => set({ bookId: val }),

	bookVer: 'ko',
	setBookVer: (val) => set({ bookVer: val }),

	// 현재 선택된 제어기 모델 ('Hi6'|'Hi7')
	contModel: 'Hi6',
	setContModel: (val) => set({ contModel: val }),

	// review rules 체크박스 상태
	reviewRules: {
		checkBrokenLinks: true,
		checkSpecialChars: true,
		replaceSpecialChars: true,
		checkProhibitedStrs: true
	},
	setReviewRules: (val) => set({ reviewRules: val })
}));

export { useStore };
