import { useNavigation } from '@react-navigation/native'
import { Media } from '@stump/types'
import { X } from 'lucide-react-native'
import { useColorScheme } from 'nativewind'
import React from 'react'
import { TouchableOpacity } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { ScreenRootView } from '@/components/primitives'
import { Text, View } from '@/components/primitives'
import { useReaderStore } from '@/stores'

type Props = {
	children: React.ReactNode
	book: Media
}

export default function ReaderContainer({ book, children }: Props) {
	const showToolBar = useReaderStore((state) => state.showToolBar)

	const { bottom, top } = useSafeAreaInsets()
	const { colorScheme } = useColorScheme()
	const { goBack } = useNavigation()

	return (
		<ScreenRootView
			// TODO: timeout or something
			hideStatusBar={!showToolBar}
		>
			<View
				className="absolute left-0 right-0 top-0 z-[100] shrink-0 bg-black/10 px-2 dark:bg-black/80"
				style={{
					display: showToolBar ? 'flex' : 'none',
				}}
			>
				<View className="flex-row items-center space-x-2 pb-2 pt-7">
					<TouchableOpacity onPress={goBack} className="w-1/4 shrink-0">
						<X color={colorScheme === 'dark' ? 'white' : 'black'} size={30} />
					</TouchableOpacity>
					<Text className="flex-1 text-center text-lg">{book.name}</Text>
					<View className="w-1/4 shrink-0" />
				</View>
			</View>
			{children}
			<View
				className="absolute bottom-0 left-0 right-0 z-[100] shrink-0 bg-black/10 dark:bg-black/80"
				style={{
					display: showToolBar ? 'flex' : 'none',
					paddingBottom: bottom,
				}}
			>
				<Text>Bottom</Text>
			</View>
		</ScreenRootView>
	)
}
