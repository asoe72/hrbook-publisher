import { create } from 'zustand';

const useStore = create((set) => ({

	// app-version
	appVersion: '...',
	setAppVersion: (val) => set({ appVersion: val }),

	// source-type ('local'|'remote-book|'remote-books-all')
	sourceType: 'local',
	setSourceType: (val) => set({ sourceType: val }),

	// local source-path .md
	pathMd: '',
	setPathMd: (val) => set({ pathMd: val }),

	// remote book
	bookId: 'doc-hi6-open-api',
	setBookId: (val) => set({ bookId: val }),

	verId: 'ko',
	setVerId: (val) => set({ verId: val }),

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
	setReviewRules: (val) => set({ reviewRules: val }),

	// review filters 체크박스 상태
	reviewFilters: {
		languages: { english: true, korean: true, chinese: false },
		products:  { hi5a: false, hi6: false, hi7: true, manipulator: false, common: true }
	},
	setReviewFilters: (val) => set({ reviewFilters: val })
}));

export { useStore };
