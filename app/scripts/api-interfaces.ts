// Prints, as JSON on stdout, every interface under src/api/ and every interface
// those fields point at: its file and its field names, each marked nullable or not.
// api/tests/test_api_contract.py compares that against the API's OpenAPI schemas.
// Run with `node scripts/api-interfaces.ts`, from the app folder.
import { readdirSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

const APP_PATH = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SRC_PATH = join(APP_PATH, 'src')
const API_PATH = join(SRC_PATH, 'api')

interface FieldInfo {
  nullable: boolean
}

interface InterfaceInfo {
  file: string
  fields: Record<string, FieldInfo>
}

function findTypeScriptFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) return findTypeScriptFiles(path)
    return entry.name.endsWith('.ts') ? [path] : []
  })
}

function isNullable(type: ts.Type): boolean {
  const members = type.isUnion() ? type.types : [type]
  return members.some((member) => (member.flags & ts.TypeFlags.Null) !== 0)
}

function isInsideSource(file: ts.SourceFile): boolean {
  return !file.isDeclarationFile && file.fileName.startsWith(SRC_PATH)
}

const configPath = join(APP_PATH, 'tsconfig.app.json')
const config = ts.getParsedCommandLineOfConfigFile(
  configPath,
  { noEmit: true },
  {
    ...ts.sys,
    onUnRecoverableConfigFileDiagnostic: (diagnostic) => {
      throw new Error(
        ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')
      )
    },
  }
)
if (!config) throw new Error(`Could not read ${configPath}`)

const program = ts.createProgram(findTypeScriptFiles(API_PATH), config.options)
const checker = program.getTypeChecker()
const interfaces: Record<string, InterfaceInfo> = {}

function collect(declaration: ts.InterfaceDeclaration): void {
  const file = relative(APP_PATH, declaration.getSourceFile().fileName)
  const key = `${file}::${declaration.name.text}`
  if (key in interfaces) return
  const fields: Record<string, FieldInfo> = {}
  interfaces[key] = { file, fields }

  const type = checker.getTypeAtLocation(declaration)
  const pending: ts.Type[] = []
  for (const property of checker.getPropertiesOfType(type)) {
    const propertyType = checker.getTypeOfSymbol(property)
    fields[property.name] = { nullable: isNullable(propertyType) }
    const members = propertyType.isUnion() ? propertyType.types : [propertyType]
    for (const member of members) {
      pending.push(
        ...(checker.isArrayType(member)
          ? checker.getTypeArguments(member as ts.TypeReference)
          : [member])
      )
    }
  }
  for (const target of pending) {
    for (const nested of target.symbol?.declarations ?? []) {
      if (
        ts.isInterfaceDeclaration(nested) &&
        isInsideSource(nested.getSourceFile())
      ) {
        collect(nested)
      }
    }
  }
}

for (const file of program.getSourceFiles()) {
  if (!file.fileName.startsWith(API_PATH)) continue
  ts.forEachChild(file, (node) => {
    if (ts.isInterfaceDeclaration(node)) collect(node)
  })
}

process.stdout.write(`${JSON.stringify(interfaces, null, 2)}\n`)
