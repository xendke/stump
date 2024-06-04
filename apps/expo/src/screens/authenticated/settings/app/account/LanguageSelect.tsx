import { useState } from 'react'
import SelectBox from 'react-native-multi-selectbox'

import { View } from '@/components'
export default function LanguageSelect() {
	const [selectedLang, setLang] = useState('en')

	const LANG_OPTIONS = [
		{
			id: 'af',
			item: 'Afrikaans',
		},
		{
			id: 'ar',
			item: 'العربية',
		},
		{
			id: 'ca',
			item: 'Català',
		},
		{
			id: 'cs',
			item: 'Čeština',
		},
		{
			id: 'da',
			item: 'Dansk',
		},
		{
			id: 'de',
			item: 'Deutsch',
		},
		{
			id: 'el',
			item: 'Ελληνικά',
		},
		{
			id: 'en',
			item: 'English',
		},
		{
			id: 'es',
			item: 'Español',
		},
		{
			id: 'fi',
			item: 'Suomi',
		},
		{
			id: 'fr',
			item: 'Français',
		},
		{
			id: 'he',
			item: 'עברית',
		},
		{
			id: 'hu',
			item: 'Hungarian',
		},
		{
			id: 'it',
			item: 'Italiano',
		},
		{
			id: 'ja',
			item: '日本語',
		},
		{
			id: 'ko',
			item: '한국어',
		},
		{
			id: 'nl',
			item: 'Nederlands',
		},
		{
			id: 'no',
			item: 'Norsk',
		},
		{
			id: 'pl',
			item: 'Polski',
		},
		{
			id: 'pt',
			item: 'Português',
		},
		{
			id: 'ro',
			item: 'Română',
		},
		{
			id: 'ru',
			item: 'Русский',
		},
		{
			id: 'sr',
			item: 'Srpski',
		},
		{
			id: 'sv',
			item: 'Svenska',
		},
		{
			id: 'tr',
			item: 'Türkçe',
		},
		{
			id: 'uk',
			item: 'Українська',
		},
		{
			id: 'vi',
			item: 'Tiếng Việt',
		},
		{
			id: 'zh',
			item: '中文',
		},
	]
	return (
		<View style={{ margin: 30 }}>
			<SelectBox
				label="Set Language"
				options={LANG_OPTIONS}
				value={selectedLang}
				onChange={() => {
					return (val) => setLang(val)
				}}
			/>
		</View>
	)
}
