import AsyncStorage from '@react-native-async-storage/async-storage'
import { BookPreferences as IBookPreferences } from '@stump/client'
import dayjs from 'dayjs'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useStopwatch } from 'react-timer-hook'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import { useActiveServer } from '~/components/activeServer'

type GlobalSettings = IBookPreferences & { incognito?: boolean; preferSmallImages?: boolean }
export type BookPreferences = IBookPreferences & {
	serverID?: string
}

type ElapsedSeconds = number

export type ReaderStore = {
	isReading: boolean
	setIsReading: (reading: boolean) => void

	globalSettings: GlobalSettings
	setGlobalSettings: (settings: Partial<GlobalSettings>) => void

	bookSettings: Record<string, BookPreferences>
	addBookSettings: (id: string, preferences: BookPreferences) => void
	setBookSettings: (id: string, preferences: Partial<BookPreferences>) => void
	clearLibrarySettings: (serverID: string) => void

	bookTimers: Record<string, ElapsedSeconds>
	setBookTimer: (id: string, timer: ElapsedSeconds) => void

	showControls: boolean
	setShowControls: (show: boolean) => void
}

export const useReaderStore = create<ReaderStore>()(
	persist(
		(set, get) =>
			({
				isReading: false,
				setIsReading: (reading) => set({ isReading: reading }),
				globalSettings: {
					brightness: 1,
					readingDirection: 'ltr',
					imageScaling: {
						scaleToFit: 'width',
					},
					readingMode: 'paged',
					preferSmallImages: false,
				} satisfies GlobalSettings,
				setGlobalSettings: (updates: Partial<GlobalSettings>) =>
					set({ globalSettings: { ...get().globalSettings, ...updates } }),

				bookSettings: {},
				addBookSettings: (id, preferences) =>
					set({ bookSettings: { ...get().bookSettings, [id]: preferences } }),
				setBookSettings: (id, updates) =>
					set({
						bookSettings: {
							...get().bookSettings,
							[id]: { ...get().bookSettings[id], ...updates },
						},
					}),
				clearLibrarySettings: (serverID) =>
					set({
						bookSettings: Object.fromEntries(
							Object.entries(get().bookSettings).filter(
								([, settings]) => settings.serverID !== serverID,
							),
						),
					}),

				bookTimers: {},
				setBookTimer: (id, elapsedSeconds) =>
					set({ bookTimers: { ...get().bookTimers, [id]: elapsedSeconds } }),

				showControls: false,
				setShowControls: (show) => set({ showControls: show }),
			}) as ReaderStore,
		{
			name: 'stump-reader-store',
			storage: createJSONStorage(() => AsyncStorage),
			version: 1,
		},
	),
)

export const useBookPreferences = (id: string) => {
	const {
		activeServer: { id: serverID },
	} = useActiveServer()

	const store = useReaderStore((state) => state)

	const bookSettings = useMemo(() => store.bookSettings[id], [store.bookSettings, id])

	const setBookPreferences = useCallback(
		(updates: Partial<BookPreferences>) => {
			if (!bookSettings) {
				store.addBookSettings(id, {
					...store.globalSettings,
					...updates,
					serverID,
				})
			} else {
				store.setBookSettings(id, { ...updates, serverID })
			}
		},
		[id, bookSettings, store, serverID],
	)

	return {
		preferences: {
			...(bookSettings || store.globalSettings),
			incognito: store.globalSettings.incognito,
			preferSmallImages: store.globalSettings.preferSmallImages,
		},
		setBookPreferences,
		updateGlobalSettings: store.setGlobalSettings,
	}
}

type UseBookTimerParams = {
	initial?: number | null
}

export const useBookReadTime = (id: string, { initial }: UseBookTimerParams = {}) => {
	const bookTimers = useReaderStore((state) => state.bookTimers)
	const bookTimer = useMemo(() => bookTimers[id] || 0, [bookTimers, id])
	return bookTimer || initial || 0
}

export const useBookTimer = (id: string, params: UseBookTimerParams = {}) => {
	const [initial] = useState(() => params.initial)

	const bookTimers = useReaderStore((state) => state.bookTimers)
	const bookTimer = useMemo(() => bookTimers[id] || 0, [bookTimers, id])
	const setBookTimer = useReaderStore((state) => state.setBookTimer)

	const resolvedTimer = useMemo(
		() => (!!initial && initial > bookTimer ? initial : bookTimer),
		[initial, bookTimer],
	)

	const { pause, totalSeconds, reset, isRunning } = useStopwatch({
		autoStart: !!id,
		offsetTimestamp: dayjs()
			.add(resolvedTimer || 0, 'seconds')
			.toDate(),
	})

	const pauseTimer = useCallback(() => {
		if (isRunning) {
			pause()
			setBookTimer(id, totalSeconds)
		}
	}, [id, pause, setBookTimer, totalSeconds, isRunning])

	const resumeTimer = useCallback(() => {
		if (!isRunning) {
			const offset = dayjs().add(totalSeconds, 'seconds').toDate()
			reset(offset)
		}
	}, [totalSeconds, reset, isRunning])

	useEffect(() => {
		reset(
			dayjs()
				.add(resolvedTimer || 0, 'seconds')
				.toDate(),
		)
	}, [resolvedTimer, reset])

	return { totalSeconds, pause: pauseTimer, resume: resumeTimer, isRunning }
}

export const useHideStatusBar = () => {
	const { isReading, showControls } = useReaderStore((state) => ({
		isReading: state.isReading,
		showControls: state.showControls,
	}))

	return isReading && !showControls
}
