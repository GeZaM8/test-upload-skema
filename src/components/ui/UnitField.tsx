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
import ElementField from "./ElementField";
import type { SkemaType } from "../../App";

export default function UnitField({
	unitFields,
	unitIndex,
	useForm,
	removeUnit,
}: {
	unitFields: FieldArrayWithId<SkemaType, "unit", "id">[];
	unitIndex: number;
	useForm: {
		control: Control<SkemaType>;
		register: UseFormRegister<SkemaType>;
	};
	removeUnit: UseFieldArrayRemove;
}) {
	const { control, register } = useForm;
	const field = unitFields[unitIndex];

	const {
		fields: elementFields,
		append: appendElement,
		remove: removeElement,
	} = useFieldArray({
		control,
		name: `unit.${unitIndex}.elemen`,
	});

	return (
		<VStack
			key={field.id}
			align="start"
			w="full"
			p="1em"
			border="1px solid #ccc"
			borderRadius="md"
		>
			<Heading as="h2" size="md">
				Unit Kompetensi {unitIndex + 1}
			</Heading>

			<HStack w="full">
				<Field.Root>
					<Field.Label>Kode Unit</Field.Label>
					<Input {...register(`unit.${unitIndex}.kode`)} />
				</Field.Root>
				<Field.Root>
					<Field.Label>Judul Unit</Field.Label>
					<Input {...register(`unit.${unitIndex}.judul`)} />
				</Field.Root>
			</HStack>

			{elementFields.map((_elementField, elementIndex) => (
				<ElementField
					elementFields={elementFields}
					useForm={{ control, register }}
					unitIndex={unitIndex}
					elementIndex={elementIndex}
					removeElement={removeElement}
				/>
			))}

			<Button
				type="button"
				onClick={() =>
					appendElement({ id: "", text: "", item: [{ id: "", text: "" }] })
				}
			>
				Tambah Elemen
			</Button>

			<Button
				type="button"
				variant="outline"
				colorScheme="red"
				onClick={() => removeUnit(unitIndex)}
			>
				Hapus Unit
			</Button>
		</VStack>
	);
}
