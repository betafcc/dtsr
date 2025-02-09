#!/usr/bin/env node
import ts from 'typescript'
import { version } from './package.json'

const helpMessage = `
Usage: dtsr [options] <source-file> [args...]

Evaluate type-level expressions from TypeScript declaration files.

Options:
  -v, --version            Output the version number
  -e, --eval <expression>  Evaluate a type expression in the context of the source file
  -p, --project <path>     Specify the TypeScript configuration file (default: tsconfig.json)
  -h, --help               Display this help message

Examples:
  $ dtsr ./Main.d.ts Joe
  $ dtsr -e 'Foo<string, number>' ./Main.d.ts
  $ dtsr -p tsconfig.prod.json ./Main.d.ts Joe
`

const parseArgs = (
  args: string[],
): {
  project?: string
  eval?: string
  help: boolean
  version: boolean
  sourcePath?: string
  args: string[]
} => {
  let project: string | undefined
  let evalStr: string | undefined
  let help = false
  let version = false
  let i = 0
  const n = args.length

  while (i < n) {
    const arg = args[i]
    if (arg === '-p' || arg === '--project') {
      if (i + 1 >= n) throw new Error(`Option ${arg} requires a value.`)
      project = args[i + 1]
      i += 2
    } else if (arg === '-e' || arg === '--eval') {
      if (i + 1 >= n) throw new Error(`Option ${arg} requires a value.`)
      evalStr = args[i + 1]
      i += 2
    } else if (arg === '-h' || arg === '--help') {
      help = true
      i += 1
    } else if (arg === '-v' || arg === '--version') {
      version = true
      i += 1
    } else if (arg.startsWith('-')) {
      throw new Error(`Unknown option: ${arg}`)
    } else {
      const sourcePath = arg
      return {
        project,
        eval: evalStr,
        help,
        version,
        sourcePath,
        args: args.slice(i + 1),
      }
    }
  }

  return {
    project,
    eval: evalStr,
    help,
    version,
    sourcePath: undefined,
    args: [],
  }
}

const getConfig = (projectPath?: string) => {
  let configPath: string | undefined

  if (projectPath) {
    configPath = ts.sys.resolvePath(projectPath)
    if (!ts.sys.fileExists(configPath)) {
      throw new Error(`Config file not found: ${projectPath}`)
    }
  } else {
    configPath = ts.findConfigFile('./', ts.sys.fileExists, 'tsconfig.json')
  }

  if (!configPath) return { options: {} }

  const parsedCommandLine = ts.getParsedCommandLineOfConfigFile(
    configPath,
    {},
    {
      ...ts.sys,
      onUnRecoverableConfigFileDiagnostic: diagnostic =>
        console.error('Config file diagnostic:', diagnostic.messageText),
    },
  )

  if (!parsedCommandLine) throw new Error('Error parsing tsconfig.json.')

  return parsedCommandLine
}

const typeToString = (checker: ts.TypeChecker, c: ts.TypeAliasDeclaration) =>
  checker.typeToString(
    checker.getTypeAtLocation(c.type),
    undefined,
    ts.TypeFormatFlags.InTypeAlias | ts.TypeFormatFlags.NoTruncation,
  )

const resultName = '__dtsr_result_type'

interface RunOptions {
  projectPath?: string
  evalString?: string
}

const run = (
  sourcePath: string | undefined, // TODO: better refactor for eval only case
  args: string[],
  options: RunOptions = {},
) => {
  const config = getConfig(options.projectPath)
  const host = ts.createCompilerHost(config.options)
  const fakeSourcePath =
    sourcePath !== undefined
      ? sourcePath.endsWith('.ts')
        ? sourcePath
        : `${sourcePath}.ts`
      : 'source.ts'

  const readFile = host.readFile.bind(host)
  host.readFile = (fileName: string) => {
    if (ts.sys.resolvePath(fileName) !== ts.sys.resolvePath(fakeSourcePath))
      return readFile(fileName)

    let typeDefinition: string
    if (options.evalString) {
      typeDefinition = `type ${resultName} = ${options.evalString}`
    } else if (args.length > 0) {
      typeDefinition = `type ${resultName} = Main<[${args
        .map(arg => JSON.stringify(arg))
        .join(', ')}]>`
    } else {
      typeDefinition = `type ${resultName} = Main`
    }

    const content = sourcePath === undefined ? '' : readFile(sourcePath)

    return content ? `${content}\n${typeDefinition}` : typeDefinition
  }

  const program = ts.createProgram([fakeSourcePath], config.options, host)
  const checker = program.getTypeChecker()
  const sourceFile = program.getSourceFile(fakeSourcePath)

  if (!sourceFile) throw new Error(`Could not read source file: ${sourcePath}`)

  const resultType = sourceFile.statements
    .filter(ts.isTypeAliasDeclaration)
    .find(t => t.name.text === resultName)

  if (!resultType)
    throw new Error(`Could not find type ${resultName} in ${sourcePath}`)

  return typeToString(checker, resultType)
}

const parsed = parseArgs(process.argv.slice(2))

if (parsed.help) {
  console.log(helpMessage)
  process.exit(0)
}

if (parsed.version) {
  console.log(`dtsr v${version}`)
  process.exit(0)
}

if (!parsed.sourcePath && !parsed.eval) {
  console.error('Error: No source file provided.')
  process.exit(1)
}

try {
  console.log(
    run(parsed.sourcePath, parsed.args, {
      projectPath: parsed.project,
      evalString: parsed.eval,
    }),
  )
} catch (error) {
  console.error((error as Error).message)
  process.exit(1)
}
