import { CheckBox, IconButton, Input } from '@stump/components'
import { Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { useFormContext, useFormState } from 'react-hook-form'

import { CreateOrUpdateUserSchema } from './schema'

export default function AccountDetails() {
	const form = useFormContext<CreateOrUpdateUserSchema>()
	const [generatePassword] = form.watch(['generate_password'])
	const { errors } = useFormState({ control: form.control })

	const [passwordVisible, setPasswordVisible] = useState(false)

	return (
		<div className="flex flex-col gap-4 pb-4 pt-1 md:max-w-md">
			<Input
				id="username"
				variant="primary"
				fullWidth
				label="Username"
				placeholder="Username"
				autoComplete="off"
				errorMessage={errors.username?.message}
				{...form.register('username')}
			/>
			<Input
				id="password"
				variant="primary"
				fullWidth
				label="Password"
				placeholder="Password"
				errorMessage={errors.password?.message}
				type={passwordVisible ? 'text' : 'password'}
				autoComplete="off"
				rightDecoration={
					<IconButton
						type="button"
						variant="ghost"
						size="xs"
						onClick={() => setPasswordVisible(!passwordVisible)}
						className="text-foreground-muted"
						data-testid="togglePasswordVisibility"
					>
						{passwordVisible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
					</IconButton>
				}
				{...form.register('password')}
			/>

			<div className="flex items-center gap-1">
				<CheckBox
					id="generate_password"
					data-testid="generatePassword"
					variant="primary"
					label={'Generate password'}
					checked={generatePassword}
					onClick={() => form.setValue('generate_password', !generatePassword)}
					{...form.register('generate_password')}
				/>
			</div>
		</div>
	)
}
