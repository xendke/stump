import { useSDK } from '@stump/client'
import dayjs from 'dayjs'
import duration from 'dayjs/plugin/duration'
import { Image } from 'expo-image'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { View } from 'react-native'
import { FlatList, Pressable } from 'react-native-gesture-handler'
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Progress, Text } from '~/components/ui'
import { useDisplay } from '~/lib/hooks'
import { cn } from '~/lib/utils'
import { useReaderStore } from '~/stores'
import { useBookReadTime } from '~/stores/reader'

import { useImageBasedReader } from './context'

dayjs.extend(duration)

const HEIGHT_MODIFIER = 0.75
const WIDTH_MODIFIER = 2 / 3

export default function Footer() {
	const { sdk } = useSDK()
	const { isTablet, height } = useDisplay()
	const {
		book: { pages, id },
		pageURL,
		pageThumbnailURL,
		currentPage = 1,
		flatListRef: readerRef,
	} = useImageBasedReader()
	const elapsedSeconds = useBookReadTime(id)

	const ref = useRef<FlatList>(null)
	const insets = useSafeAreaInsets()

	const visible = useReaderStore((state) => state.showControls)
	const setShowControls = useReaderStore((state) => state.setShowControls)

	const translateY = useSharedValue(0)
	useEffect(() => {
		translateY.value = withTiming(visible ? 0 : height / 2)
	}, [visible, translateY, height])

	const animatedStyles = useAnimatedStyle(() => {
		return {
			left: insets.left,
			right: insets.right,
			bottom: insets.bottom,
			transform: [{ translateY: translateY.value }],
		}
	})

	const percentage = (currentPage / pages) * 100

	const baseSize = useMemo(
		() => ({
			width: isTablet ? 100 : 75,
			height: isTablet ? 150 : 100,
		}),
		[isTablet],
	)
	const getSize = useCallback(
		(idx: number) => ({
			width: idx === currentPage ? baseSize.width / WIDTH_MODIFIER : baseSize.width,
			height: idx === currentPage ? baseSize.height / HEIGHT_MODIFIER : baseSize.height,
		}),
		[currentPage, baseSize],
	)

	const getItemLayout = useCallback(
		(_: ArrayLike<number> | null | undefined, index: number) => ({
			length: getSize(index).width,
			offset: getSize(index).width * index,
			index,
		}),
		[getSize],
	)

	const onChangePage = useCallback(
		(page: number) => {
			setShowControls(false)
			readerRef.current?.scrollToIndex({ index: page - 1, animated: false })
		},
		[readerRef, setShowControls],
	)

	const formatDuration = useCallback(() => {
		if (elapsedSeconds <= 60) {
			return `${elapsedSeconds} seconds`
		} else if (elapsedSeconds <= 3600) {
			return dayjs.duration(elapsedSeconds, 'seconds').format('m [minutes] s [seconds]')
		} else {
			return dayjs
				.duration(elapsedSeconds, 'seconds')
				.format(`H [hour${elapsedSeconds >= 7200 ? 's' : ''}] m [minutes]`)
		}
	}, [elapsedSeconds])

	const pageSource = useCallback(
		(page: number) => ({
			uri: pageThumbnailURL ? pageThumbnailURL(page) : pageURL(page),
			headers: {
				Authorization: sdk.authorizationHeader,
			},
		}),
		[pageURL, pageThumbnailURL, sdk],
	)

	useEffect(
		() => {
			const windowSize = isTablet ? 8 : 6
			const start = Math.max(0, currentPage - windowSize)
			const end = Math.min(pages, currentPage + windowSize)
			const urls = Array.from({ length: end - start }, (_, i) =>
				pageThumbnailURL ? pageThumbnailURL(i + start) : pageURL(i + start),
			)
			Image.prefetch(urls, {
				headers: {
					Authorization: sdk.authorizationHeader || '',
				},
				// cachePolicy: 'memory',
			})
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[currentPage],
	)

	return (
		<Animated.View className="absolute z-20 shrink gap-4 px-1" style={animatedStyles}>
			<FlatList
				ref={ref}
				data={Array.from({ length: pages }, (_, i) => i + 1)}
				keyExtractor={(item) => item.toString()}
				renderItem={({ item: page }) => (
					<View className={cn({ 'pl-1': page === 1, 'pr-1': page === pages })}>
						<Pressable onPress={() => onChangePage(page)}>
							<View className="aspect-[2/3] items-center justify-center overflow-hidden rounded-xl shadow-lg">
								<Image
									source={pageSource(page)}
									cachePolicy="memory"
									style={getSize(page)}
									contentFit="fill"
								/>
							</View>
						</Pressable>

						{page !== currentPage && (
							<Text size="sm" className="shrink-0 text-center text-[#898d94]">
								{page}
							</Text>
						)}
					</View>
				)}
				contentContainerStyle={{ gap: 4, alignItems: 'flex-end' }}
				getItemLayout={getItemLayout}
				horizontal
				showsHorizontalScrollIndicator={false}
				initialScrollIndex={currentPage - 1}
				windowSize={5}
				initialNumToRender={isTablet ? 8 : 6}
				maxToRenderPerBatch={isTablet ? 8 : 6}
			/>

			<View className="gap-2 px-1">
				<Progress
					className="h-1 bg-[#898d94]"
					indicatorClassName="bg-[#f5f3ef]"
					value={percentage}
					max={100}
				/>

				<View className="flex flex-row justify-between">
					<View>
						<Text className="text-sm text-[#898d94]">Reading time: {formatDuration()}</Text>
					</View>

					<View>
						<Text className="text-sm text-[#898d94]">
							Page {currentPage} of {pages}
						</Text>
					</View>
				</View>
			</View>
		</Animated.View>
	)
}
