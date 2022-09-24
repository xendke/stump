import { Rows, SquaresFour } from 'phosphor-react';
import toast from 'react-hot-toast';

import { ButtonGroup, useColorModeValue } from '@chakra-ui/react';
import { LayoutEntity, useLayoutMode } from '@stump/client';
import { LayoutMode } from '@stump/core';

import { IconButton } from '../../ui/Button';

export default function LayoutModeButtons({ entity }: { entity: LayoutEntity }) {
	const { layoutMode, updateLayoutMode } = useLayoutMode(entity);

	async function handleChange(mode: LayoutMode) {
		updateLayoutMode(mode, (err) => {
			console.error(err);
			toast.error('Failed to update layout mode');
		});
	}

	const viewAsGrid = layoutMode === 'GRID';

	return (
		<ButtonGroup isAttached>
			<IconButton
				onClick={() => handleChange('GRID')}
				title="View as grid"
				variant="solid"
				bg={useColorModeValue(
					viewAsGrid ? 'blackAlpha.200' : 'gray.150',
					// viewAsGrid ? 'whiteAlpha.200' : 'gray.800',
					viewAsGrid ? 'whiteAlpha.50' : 'whiteAlpha.200',
				)}
			>
				<SquaresFour className="text-lg" weight="regular" />
			</IconButton>

			<IconButton
				onClick={() => handleChange('LIST')}
				title="View as list"
				variant="solid"
				bg={useColorModeValue(
					viewAsGrid ? 'gray.150' : 'blackAlpha.200',
					// viewAsGrid ? 'gray.800' : 'whiteAlpha.200',
					viewAsGrid ? 'whiteAlpha.200' : 'whiteAlpha.50',
				)}
			>
				<Rows className="text-lg" weight="regular" />
			</IconButton>
		</ButtonGroup>
	);
}