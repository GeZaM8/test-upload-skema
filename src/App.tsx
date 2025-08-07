import "./App.css";
import {
	Button,
	Field,
	Heading,
	Input,
	SimpleGrid,
	VStack,
} from "@chakra-ui/react";
import { useFieldArray, useForm } from "react-hook-form";
import mammoth from "mammoth";
import UnitField from "./components/ui/UnitField";

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

		console.log(html);

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

				{fields.map((_field, unitIndex) => (
					<UnitField
						unitFields={fields}
						useForm={{ control, register }}
						removeUnit={remove}
						unitIndex={unitIndex}
						key={_field.id}
					/>
				))}

				<Button
					type="button"
					colorScheme="teal"
					onClick={() =>
						append({
							kode: "",
							judul: "",
							elemen: [{ id: "", text: "", item: [{ id: "", text: "" }] }],
						})
					}
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

	const tables = Array.from(doc.querySelectorAll("table"));
	console.log(tables);
	if (tables.length === 0)
		throw new Error("Tidak ada tabel ditemukan dalam dokumen.");

	let jurusan = "";
	let judulSkema = "";
	let nomorSkema = "";
	const units: Unit[] = [];

	let currentUnit: Unit | null = null;
	let currentElemen: Element | null = null;
	let elemenCounter = 1;
	let itemCounter = 1;

	for (const table of tables) {
		const rows = Array.from(table.querySelectorAll("tr"));

		for (const row of rows) {
			const text = row.innerText.trim();
			const cells = Array.from(row.querySelectorAll("td")).map((td) =>
				td.innerText.trim()
			);

			if (text.includes("Skema Sertifikasi")) {
				judulSkema = cells[1] || "";
				nomorSkema = cells[3] || "";
				continue;
			}

			if (text.includes("Kode Unit")) {
				const kodeMatch = text.match(/Kode Unit\s*:?\s*(.+)/);
				const kode =
					kodeMatch?.[1]?.trim() || cells[1]?.replace(":", "").trim() || "";
				currentUnit = {
					kode,
					judul: "",
					elemen: [],
				};
				continue;
			}

			if (text.includes("Judul Unit")) {
				const judulMatch = text.match(/Judul Unit\s*:?\s*(.+)/);
				const judul =
					judulMatch?.[1]?.trim() || cells[1]?.replace(":", "").trim() || "";
				if (currentUnit) {
					currentUnit.judul = judul;
					units.push(currentUnit);
					currentUnit = null;
				}
				continue;
			}

			if (text.match(/Elemen\s*\d+\s*:/)) {
				const match = text.match(/Elemen\s*(\d+)\s*:\s*(.*)/);
				const id = match?.[1] || `${elemenCounter}`;
				const elemenText = match?.[2]?.trim() || `Elemen ${elemenCounter}`;
				const ol = row.querySelector("ol");
				const items = ol
					? Array.from(ol.querySelectorAll("li")).map((li, i) => ({
							id: `${elemenCounter}.${i + 1}`,
							text: li.textContent?.trim() || "",
					  }))
					: [];

				currentElemen = {
					id,
					text: elemenText,
					item: items,
				};
				if (units.length > 0) {
					units[units.length - 1].elemen.push(currentElemen);
				}
				elemenCounter++;
				itemCounter = 1;
				continue;
			}
		}
	}

	const filteredUnits = units.filter((unit) => unit.elemen.length > 0);

	return {
		jurusan,
		judul: judulSkema,
		nomor: nomorSkema,
		unit: filteredUnits,
	};
}

export default App;
