import { useState } from "react";
import "./App.css";
import {
	Button,
	Field,
	Heading,
	HStack,
	Input,
	SimpleGrid,
	VStack,
} from "@chakra-ui/react";
import { useFieldArray, useForm } from "react-hook-form";
import mammoth from "mammoth";
import ElementField from "./components/ui/ElementField";

export type SkemaType = {
	jurusan: string;
	judul: string;
	nomor: string;
	unit: Unit[];
};

interface Unit {
	kode: string;
	judul: string;
	elemen: Element[];
}

interface Element {
	id: string;
	text: string;
	item: ItemElement[];
}

interface ItemElement {
	id: string;
	text: string;
}

const defaultValues: SkemaType = {
	jurusan: "",
	judul: "",
	nomor: "",
	unit: [
		{
			kode: "",
			judul: "",
			elemen: [
				{
					id: "",
					text: "",
					item: [
						{
							id: "",
							text: "",
						},
					],
				},
			],
		},
	],
};

function App() {
	const { register, handleSubmit, control, reset } = useForm<SkemaType>({
		defaultValues: defaultValues,
	});
	const { fields, append, remove } = useFieldArray({
		control,
		name: "unit",
	});

	function handleDocxData(parsedData: SkemaType) {
		reset(parsedData);
	}

	async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		if (!file) return;
		const html = await extractDocxText(file);

		const parsedData = parseHTMLToSchema(html);
		handleDocxData(parsedData);
	}

	return (
		<VStack asChild gap="1em" m={"1em"}>
			<form action="">
				<Heading as="h1">Skema</Heading>
				<SimpleGrid columns={[2]} gap="1em" w="full">
					<Field.Root>
						<Field.Label>Jurusan</Field.Label>
						<Input {...register("jurusan")} />
					</Field.Root>
					<Field.Root>
						<Field.Label>Judul Skema</Field.Label>
						<Input {...register("judul")} />
					</Field.Root>
					<Field.Root>
						<Field.Label>Nomor Skema</Field.Label>
						<Input {...register("nomor")} />
					</Field.Root>
				</SimpleGrid>

				{fields.map((field, unitIndex) => {
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

							<ElementField
								elementFields={elementFields}
								useForm={{ control, register }}
								unitIndex={unitIndex}
								removeElement={removeElement}
							/>

							<Button
								type="button"
								onClick={() => appendElement({ id: "", text: "", item: [] })}
							>
								Tambah Elemen
							</Button>

							<Button
								type="button"
								variant="outline"
								colorScheme="red"
								onClick={() => remove(unitIndex)}
							>
								Hapus Unit
							</Button>
						</VStack>
					);
				})}

				<Button
					type="button"
					colorScheme="teal"
					onClick={() => append({ kode: "", judul: "", elemen: [] })}
				>
					Tambah Unit
				</Button>

				<Button type="submit" colorScheme="green">
					Simpan Skema
				</Button>
				<input type="file" accept=".docx" onChange={handleUpload} />
			</form>
		</VStack>
	);
}

async function extractDocxText(file: File) {
	const arrayBuffer = await file.arrayBuffer();
	const result = await mammoth.convertToHtml({ arrayBuffer });
	return result.value;
}

export function parseHTMLToSchema(html: string): SkemaType {
	const parser = new DOMParser();
	const doc = parser.parseFromString(html, "text/html");

	const table = doc.querySelector("table");
	if (!table) throw new Error("Tabel tidak ditemukan di HTML.");

	const rows = Array.from(table.querySelectorAll("tr"));

	let kodeUnit = "";
	let judulUnit = "";
	const elemenList: Element[] = [];

	let elementCounter = 1;

	for (const row of rows) {
		const cells = Array.from(row.querySelectorAll("td"));

		if (cells.length === 0) continue;

		const rowText = row.innerText.trim();

		// Ambil Kode Unit
		if (rowText.includes("Kode Unit")) {
			const match = rowText.match(/Kode Unit\s*:\s*(.+)/);
			if (match) kodeUnit = match[1];
		}

		// Ambil Judul Unit
		if (rowText.includes("Judul Unit")) {
			const match = rowText.match(/Judul Unit\s*:\s*(.+)/);
			if (match) judulUnit = match[1].trim();
		}

		// Ambil Elemen dan Kriteria
		if (rowText.includes("Elemen")) {
			const elemenMatch = rowText.match(/Elemen\s*\d+\s*:\s*(.+)/);
			const elemenText = elemenMatch
				? elemenMatch[1].trim()
				: `Elemen ${elementCounter}`;

			const ol = row.querySelector("ol");
			const items = ol
				? Array.from(ol.querySelectorAll("li")).map((li, i) => ({
						id: `${elementCounter}.${i + 1}`,
						text: li.textContent?.trim() || "",
				  }))
				: [];

			elemenList.push({
				id: `${elementCounter++}`,
				text: elemenText,
				item: items,
			});
		}
	}

	const skema: SkemaType = {
		jurusan: "",
		judul: judulUnit,
		nomor: kodeUnit,
		unit: [
			{
				kode: kodeUnit,
				judul: judulUnit,
				elemen: elemenList,
			},
		],
	};

	console.log(skema);
	return skema;
}

export default App;
