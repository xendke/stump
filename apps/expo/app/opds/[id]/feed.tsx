import { useQuery, useSDK } from '@stump/client'
import { useLocalSearchParams } from 'expo-router'
import { ScrollView } from 'react-native-gesture-handler'
import { SafeAreaView } from 'react-native-safe-area-context'

import { MaybeErrorFeed, OPDSFeed, OPDSPublicationFeed } from '~/components/opds'
import RefreshControl from '~/components/RefreshControl'

export default function Screen() {
	const { url: feedURL } = useLocalSearchParams<{ url: string }>()
	const { sdk } = useSDK()
	const {
		data: feed,
		refetch,
		isRefetching,
		error,
	} = useQuery([sdk.opds.keys.feed, feedURL], () => sdk.opds.feed(feedURL), {
		suspense: true,
		useErrorBoundary: false,
	})

	if (!feed) return <MaybeErrorFeed error={error} />

	// const allGroupsEmpty = feed.groups.every(
	// 	(group) => !group.navigation.length && !group.publications.length,
	// )
	const isPublicationFeed = feed.publications.length > 0

	const renderContent = () => {
		if (isPublicationFeed) {
			return <OPDSPublicationFeed feed={feed} onRefresh={refetch} isRefreshing={isRefetching} />
		} else {
			return (
				<ScrollView
					className="flex-1 gap-5 bg-background px-6"
					refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
				>
					<OPDSFeed feed={feed} />
				</ScrollView>
			)
		}
	}

	return <SafeAreaView className="flex-1 bg-background">{renderContent()}</SafeAreaView>
}
