import { SDKContext, StumpClientContextProvider } from '@stump/client'
import { Api, LoginResponse, User, UserPermission } from '@stump/sdk'
import { Redirect, Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { ActiveServerContext, StumpServerContext } from '~/components/activeServer'
import { PermissionEnforcerOptions } from '~/components/activeServer/context'
import ServerAuthDialog from '~/components/ServerAuthDialog'
import { authSDKInstance } from '~/lib/sdk/auth'
import { useSavedServers } from '~/stores'

export default function Screen() {
	const router = useRouter()

	const { savedServers, getServerToken, saveServerToken, deleteServerToken, getServerConfig } =
		useSavedServers()
	const { id: serverID } = useLocalSearchParams<{ id: string }>()

	const activeServer = useMemo(
		() => savedServers.find((server) => server.id === serverID),
		[serverID, savedServers],
	)

	const [sdk, setSDK] = useState<Api | null>(null)
	const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false)
	const [user, setUser] = useState<User | null>(null)

	useEffect(() => {
		if (!activeServer) return

		const configureSDK = async () => {
			const { id, url } = activeServer
			const existingToken = await getServerToken(id)
			const serverConfig = await getServerConfig(id)
			const instance = new Api({ baseURL: url, authMethod: 'token' })

			const authedInstance = await authSDKInstance(instance, {
				config: serverConfig,
				existingToken,
				saveToken: async (token, forUser) => {
					await saveServerToken(activeServer?.id || 'dev', token)
					setUser(forUser)
				},
			})

			if (!authedInstance) {
				setIsAuthDialogOpen(true)
			}

			setSDK(authedInstance || instance)
		}

		if (!sdk && !isAuthDialogOpen) {
			configureSDK()
		}
	}, [activeServer, sdk, getServerToken, isAuthDialogOpen, getServerConfig, saveServerToken])

	useEffect(() => {
		if (user || !sdk || !sdk.isAuthed) return

		const fetchUser = async () => {
			try {
				const user = await sdk.auth.me()
				setUser(user)
			} catch (error) {
				console.error(error)
			}
		}

		fetchUser()
	}, [sdk, user])

	const handleAuthDialogClose = useCallback(
		(loginResp?: LoginResponse) => {
			if (!loginResp || !('for_user' in loginResp) || !activeServer) {
				router.dismissAll()
			} else {
				const {
					for_user,
					token: { access_token, expires_at },
				} = loginResp
				const instance = new Api({
					baseURL: activeServer.url,
					authMethod: 'token',
				})
				instance.token = access_token
				setSDK(instance)
				saveServerToken(activeServer?.id || 'dev', {
					expiresAt: new Date(expires_at),
					token: access_token,
				})
				setUser(for_user)
				setIsAuthDialogOpen(false)
			}
		},
		[activeServer, router, saveServerToken],
	)

	const onAuthError = useCallback(async () => {
		// Get rid of the token
		if (activeServer) {
			await deleteServerToken(activeServer.id)
		}
		// We need to retrigger the auth dialog, so we'll let the effect handle it
		setIsAuthDialogOpen(false)
		setSDK(null)
		setUser(null)
	}, [activeServer, deleteServerToken])

	const checkPermission = useCallback(
		(permission: UserPermission) =>
			user?.is_server_owner || user?.permissions.includes(permission) || false,
		[user],
	)

	const enforcePermission = useCallback(
		(permission: UserPermission, { onFailure }: PermissionEnforcerOptions = {}) => {
			if (!checkPermission(permission)) {
				onFailure?.()
			}
		},
		[checkPermission],
	)

	if (!activeServer) {
		return <Redirect href="/" />
	}

	if (!sdk) {
		return null
	}

	return (
		<ActiveServerContext.Provider
			value={{
				activeServer: activeServer,
			}}
		>
			<StumpServerContext.Provider
				value={{
					user,
					isServerOwner: user?.is_server_owner || false,
					checkPermission,
					enforcePermission,
				}}
			>
				<StumpClientContextProvider onUnauthenticatedResponse={onAuthError}>
					<SDKContext.Provider value={{ sdk, setSDK }}>
						<ServerAuthDialog isOpen={isAuthDialogOpen} onClose={handleAuthDialogClose} />
						<Stack screenOptions={{ headerShown: false }} />
					</SDKContext.Provider>
				</StumpClientContextProvider>
			</StumpServerContext.Provider>
		</ActiveServerContext.Provider>
	)
}
