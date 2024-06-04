import { ScreenRootView } from '@/components'

import LanguageSelect from './LanguageSelect'
import ProfileForm from './ProfileForm'

export default function AppAccountSettings() {
	return (
		<ScreenRootView>
			<ProfileForm />
			<LanguageSelect />
		</ScreenRootView>
	)
}
