import { useUpdatePreferences } from '@stump/client'
import { isLocale, localeNames, useLocaleContext } from '@stump/i18n'
import { useColorScheme } from 'nativewind'
import { useCallback, useMemo, useState } from 'react'
import { StyleSheet, Text, TextStyle } from 'react-native'
import { Dropdown } from 'react-native-element-dropdown'
import SelectBox from 'react-native-multi-selectbox'

import { View } from '@/components'
import { useUserStore } from '@/stores'

export default function LanguageSelect() {
	const [value, setValue] = useState('en')
	const [isFocus, setIsFocus] = useState(false)
	const { colorScheme } = useColorScheme()
	const { t, locale } = useLocaleContext()
	const { setUserPreferences, userPreferences } = useUserStore((store) => ({
		setUserPreferences: store.setUserPreferences,
		user: store.user,
		userPreferences: store.userPreferences,
	}))

	const { unsafePatch: update } = useUpdatePreferences({
		onSuccess: (preferences) => setUserPreferences(preferences),
	})

	const handleChange = useCallback(
		async (value: Value) => {
			const exists = LANG_OPTIONS.some((el) => el.id === value.id)
			if (isLocale(value.id) && exists) {
				setValue(value.id)
				await update({
					...userPreferences,
					locale: value.id,
				})
			}
			setIsFocus(false)
		},
		[userPreferences, update, value],
	)

	const labelStyles = useMemo<TextStyle>(
		() => ({
			color: colorScheme === 'dark' ? 'white' : 'black',
		}),
		[colorScheme],
	)

	const selectedValue = useMemo(() => LANG_OPTIONS.find((el) => el.id === locale), [locale])

	const renderLabel = () => {
		if (value || isFocus) {
			return <Text style={[styles.label, isFocus && { color: 'blue' }]}>Dropdown label</Text>
		}
		return null
	}

	return (
		<View style={styles.container}>
			{renderLabel()}
			<Dropdown
				style={[styles.dropdown, isFocus && { borderColor: 'blue' }]}
				placeholderStyle={styles.placeholderStyle}
				selectedTextStyle={styles.selectedTextStyle}
				inputSearchStyle={styles.inputSearchStyle}
				iconStyle={styles.iconStyle}
				data={LANG_OPTIONS}
				search
				maxHeight={300}
				labelField="item"
				valueField="id"
				placeholder={!isFocus ? 'Select item' : '...'}
				searchPlaceholder="Search..."
				value={selectedValue}
				onFocus={() => setIsFocus(true)}
				onBlur={() => setIsFocus(false)}
				onChange={handleChange}
				/*renderLeftIcon={() => (
					<AntDesign
						style={styles.icon}
						color={isFocus ? 'blue' : 'black'}
						name="Safety"
						size={20}
					/>
				)}*/
			/>
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		backgroundColor: 'white',
		padding: 16,
	},
	dropdown: {
		borderColor: 'gray',
		borderRadius: 8,
		borderWidth: 0.5,
		height: 50,
		paddingHorizontal: 8,
	},
	icon: {
		marginRight: 5,
	},
	iconStyle: {
		height: 20,
		width: 20,
	},
	inputSearchStyle: {
		fontSize: 16,
		height: 40,
	},
	label: {
		backgroundColor: 'white',
		fontSize: 14,
		left: 22,
		paddingHorizontal: 8,
		position: 'absolute',
		top: 8,
		zIndex: 999,
	},
	placeholderStyle: {
		fontSize: 16,
	},
	selectedTextStyle: {
		fontSize: 16,
	},
})
const LANG_OPTIONS = Object.entries(localeNames).map(([id, item]) => ({
	id,
	item,
}))
type Value = (typeof LANG_OPTIONS)[number]
