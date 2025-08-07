import {
	Button,
	Field,
	Heading,
	HStack,
	Input,
	VStack,
} from "@chakra-ui/react";
import {
	useFieldArray,
	type Control,
	type FieldArrayWithId,
	type UseFieldArrayRemove,
	type UseFormRegister,
} from "react-hook-form";
import type { SkemaType } from "../../App";

export default function ElementField({
	elementFields,
	unitIndex,
	elementIndex,
	useForm,
	removeElement,
}: {
	elementFields: FieldArrayWithId<SkemaType, `unit.${number}.elemen`, "id">[];
	unitIndex: number;
	elementIndex: number;
	useForm: {
		control: Control<SkemaType>;
		register: UseFormRegister<SkemaType>;
	};
	removeElement: UseFieldArrayRemove;
}) {
	const { control, register } = useForm;
	const elementField = elementFields[elementIndex];

	const {
		fields: itemFields,
		append: appendItem,
		remove: removeItem,
	} = useFieldArray({
		control,
		name: `unit.${unitIndex}.elemen.${elementIndex}.item`,
	});

	return (
		<VStack
			key={elementField.id}
			align="start"
			w="full"
			p="1em"
			borderRadius="md"
		>
			<Heading as="h3" size="sm">
				Elemen {elementIndex + 1}
			</Heading>
			<Field.Root>
				<Field.Label>Deskripsi Elemen</Field.Label>
				<Input {...register(`unit.${unitIndex}.elemen.${elementIndex}.text`)} />
			</Field.Root>

			{itemFields.map((itemField, itemIndex) => (
				<HStack key={itemField.id} w="full">
					<Field.Root>
						<Field.Label>Deskripsi Item</Field.Label>
						<Input
							{...register(
								`unit.${unitIndex}.elemen.${elementIndex}.item.${itemIndex}.text`
							)}
						/>
					</Field.Root>
					<Button
						type="button"
						colorScheme="red"
						onClick={() => removeItem(itemIndex)}
					>
						Hapus Item
					</Button>
				</HStack>
			))}

			<Button
				type="button"
				colorScheme="blue"
				onClick={() => appendItem({ id: "", text: "" })}
			>
				Tambah Item
			</Button>

			<Button
				type="button"
				variant="ghost"
				colorScheme="red"
				onClick={() => removeElement(elementIndex)}
			>
				Hapus Elemen
			</Button>
		</VStack>
	);
}
