import { zodResolver } from '@hookform/resolvers/zod'
import { isUrl } from '@stump/api'
import { useUpdateUser } from '@stump/client'
import { useCallback, useMemo } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { TouchableOpacity } from 'react-native'
import { z } from 'zod'

import { Input, Text, View } from '@/components'
import { useUserStore } from '@/stores'

export default function ProfileForm() {
	const { user, setUser } = useUserStore((store) => ({ setUser: store.setUser, user: store.user }))
	const { updateAsync } = useUpdateUser()
	const {
		control,
		formState: { errors },
		handleSubmit,
		reset,
		watch,
	} = useForm<FormValues>({
		defaultValues: {
			username: user.username,
		},
		resolver: zodResolver(schema),
	})

	const [formUsername, formPassword] = watch(['username', 'password'])

	/**
	 * A boolean indicating if the form has changes, which realistically just means
	 * either the username changed OR the password is not empty (i.e. the user wants to change it)
	 */
	const hasChanges = useMemo(
		() => formUsername !== user.username || !!formPassword,
		[formUsername, formPassword, user.username],
	)

	const onSubmit = useCallback(
		async (values: FormValues) => {
			if (!user || !hasChanges) {
				return
			}

			try {
				await updateAsync(
					{
						...user,
						// TODO: fix type error in generated types aaron
						age_restriction: user.age_restriction || null,
						avatar_url: user.avatar_url || null,
						password: values.password || null,
						username: values.username,
					},
					{
						onSuccess: (user) => {
							setUser(user)
							reset({ password: undefined, username: user.username })
						},
					},
				)
			} catch (error) {
				console.error(error)
			}
		},
		[user, hasChanges, updateAsync, setUser, reset],
	)

	return (
		<View className="w-full space-y-2 px-4">
			<View className="w-full">
				<Controller
					control={control}
					render={({ field: { onChange, onBlur, value } }) => (
						<Input
							autoCorrect={false}
							autoCapitalize="none"
							placeholder="Username"
							onBlur={onBlur}
							onChangeText={onChange}
							value={value}
						/>
					)}
					name="username"
				/>
				{errors.username && <Text>{errors.username.message}</Text>}
			</View>
			<View className="w-full">
				<Controller
					control={control}
					rules={{
						required: true,
					}}
					render={({ field: { onChange, onBlur, value } }) => (
						<Input
							secureTextEntry
							autoCorrect={false}
							autoCapitalize="none"
							placeholder="Password"
							onBlur={onBlur}
							onChangeText={onChange}
							value={value}
						/>
					)}
					name="password"
				/>
				{errors.password && <Text>{errors.password.message}</Text>}
			</View>
			<TouchableOpacity
				className="w-full rounded-md bg-orange-300 p-3"
				disabled={!hasChanges}
				onPress={handleSubmit(onSubmit)}
			>
				<Text className="text-center">{'Save Changes'}</Text>
			</TouchableOpacity>
		</View>
	)
}

// TODO: when translations are available, move this into the component OR make a createSchema fn instead
const schema = z.object({
	avatarUrl: z
		.string()
		.optional()
		.nullable()
		.refine(
			(url) => !url || isUrl(url),
			() => ({
				message: 'Invalid URL',
			}),
		),
	name: z.string().optional(),
	password: z.string().optional(),
	username: z.string().min(1, {
		message: 'Username must be at least 1 character',
	}),
})
type FormValues = z.infer<typeof schema>
