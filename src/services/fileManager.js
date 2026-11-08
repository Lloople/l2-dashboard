import { mkdir, writeFile } from 'node:fs/promises'

export async function storeJsonData(file, content) {
    await mkdir('public/data', { recursive: true })
    await writeFile(file, JSON.stringify(content, null, 2))
}