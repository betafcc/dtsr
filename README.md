<h1 align="center">
<picture>
    <img width="160" alt="dtsr" src=".github/logo.svg">
</picture> 

<br>

![coverage](./.github/coverage.svg)
![downloads](./.github/downloads.svg)

![NPM](https://img.shields.io/badge/NPM-%23CB3837.svg?style=for-the-badge&logo=npm&logoColor=white)
![Bun](https://img.shields.io/badge/Bun-%23000000.svg?style=for-the-badge&logo=bun&logoColor=white)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![Zig](https://img.shields.io/badge/Zig-%23F7A41D.svg?style=for-the-badge&logo=zig&logoColor=white)
![Wii U](https://img.shields.io/badge/Wii%20U-8B8B8B?style=for-the-badge&logo=wiiu&logoColor=white)
</h1>

<div align="center">

Declaration TypeScript Runner (dtsr): The easiest way to run your <em>.d.ts</em> files

<br>

<a href="#getting-started">Getting started</a>&nbsp;&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;&nbsp;<a href="#community-examples">Community examples →</a>

</div>

---

- [Getting started](#getting-started)
  - [Hello World](#hello-world)
  - [Eval a type expression in a file context](#eval-a-type-expression-in-a-file-context)
- [Documentation](#documentation)
  - [Overview](#overview)
  - [Usage](#usage)
  - [How it works](#how-it-works)
  - [CLI options in detail](#cli-options-in-detail)
  - [Basic example](#basic-example)
  - [Advanced usage](#advanced-usage)
  - [Common Gotchas](#common-gotchas)
- [Community Examples](#community-examples)
  - [FizzBuzz.d.ts](#fizzbuzzdts)
  - [Fibonacci.d.ts](#fibonaccidts)
  - [ParseQueryString.d.ts](#parsequerystringdts)
- [Is this project for real?](#is-this-project-for-real)

## Getting started

You can install `dtsr` with:

```bash
npm install --global dtsr
```

Or run directly with `npx`:

```bash
npx dtsr --help
```

### Hello World

Create a file `Hello.d.ts`:

```ts
export type Main<Argv extends string[]> = `Hello ${Argv[0]}!`
```

Run with:

```bash
> dtsr ./Hello.d.ts world
"Hello world!"
```

> [!TIP]
> **Making .d.ts executables**:
> 
> You can make your `.d.ts` files executable by adding the shebang line:
> `#!/usr/bin/env dtsr`
> <sub>(don't forget to `chmod +x ./Hello.d.ts`)</sub>


### Eval a type expression in a file context

By default, `dtsr` pass the command-line arguments to the type `Main` on the passed file, but you can also evaluate a custom expression using the `--eval` flag:

```bash
> dtsr --eval 'Main<["world"]>' ./Hello.d.ts
"Hello world!"
```

In fact, if you just want to quickly evaluate a type expression, you don't even need to create a file:

```bash
> dtsr --eval '"world" extends string ? "yes" : "no"'
"yes"
```


> [!TIP]
> Checkout our [Community Examples](#community-examples) to see more complex use cases.


## Documentation

### Overview

**dtsr** (Declaration TypeScript Runner) lets you evaluate types from a TypeScript declaration file (`.d.ts`), a normal TypeScript (`.ts`, `.tsx`) or directly from an inline expression.
You can think of it as a quick way to “run” your type-level logic instead of hoping that hovering a symbol in VSCode will not truncate the type beyond recognition.

### Usage

```bash
Usage: dtsr [options] <source-file> [args...]

Evaluate type-level expressions from TypeScript declaration files.

Options:
  -v, --version            Output the version number
  -e, --eval <expression>  Evaluate a type expression in the context of the source file
  -p, --project <path>     Specify the TypeScript configuration file (default: tsconfig.json)
  -h, --help               Display this help message

Examples:
  $ dtsr ./Main.d.ts "Joe"
  $ dtsr --eval 'Foo<string, number>' ./Main.d.ts
  $ dtsr --project tsconfig.prod.json ./Main.d.ts "Joe"
  $ dtsr --eval '"hello" extends string ? "yes" : "no"'
```

### How it works

1. **With a source file**: By default, dtsr looks for a type named `Main` in your `.d.ts` file.
   - If you pass extra arguments (`[args...]`) after the file name, these will be provided as `Main<[...args]>`.
   - If no additional arguments are given, it simply evaluates `Main`.

2. **With --eval**: Instead of looking for `Main`, `dtsr` will create a temporary type alias to evaluate whatever expression you provide.
   - If you also specify a `<source-file>`, that file's types will still be in scope, so you can reference them from your expression.

3. **Reading configuration**: By default, `dtsr` tries to find and use a local `tsconfig.json` to respect any custom compiler settings you might have.
    - If you want to point to a specific tsconfig file, use `-p` or `--project`.

4. **Behind the scenes**:

   - dtsr creates a in-memory TypeScript file that inlines your expression as type __dtsr_result_type = ....
   - It then uses the TypeScript compiler APIs to compute the type's string representation.


### CLI options in detail

- **`<source-file>`**  
  The `.d.ts` file you want to evaluate. Must be provided if you do **not** use `--eval`.

- **`[args...]`**  
  Additional string arguments appended after the `<source-file>`. These get fed into your `Main` type as `Main<[...args]>`.

- **`-e, --eval <expression>`**  
  Evaluates a custom type expression:
  ```bash
  dtsr --eval "Foo<string, number>"
  ```
  If a `<source-file>` is also specified, you can reference its exported types in your expression.

- **`-p, --project <path>`**  
  Specifies a custom tsconfig.json to use instead of automatically searching for one in the current directory:
  ```bash
  dtsr --project tsconfig.prod.json ./MyTypes.d.ts
  ```

- **`-v, --version`**  
  Displays the current version of `dtsr`.

- **`-h, --help`**  
  Displays the usage help message.

### Basic example

`Hello.d.ts`:

```ts
export type Main<Argv extends string[]> = `Hello ${Argv[0]}!`
```

Run:
```bash
> dtsr ./Hello.d.ts world
"Hello world!"
```

The use of command line arguments is optional, instead you can:

```ts
export type Main = "Hello world!"
```

Run:
```bash
> dtsr ./Hello.d.ts
"Hello world!"
```

Or you can just evaluate an expression using the types defined on the file:

```bash
> dtsr --eval '`${Main} How are you?`' ./Hello.d.ts
"Hello world! How are you?"
```

### Advanced usage

1. **Evaluate any expression without a file**  
  You can skip specifying a source file entirely by just using --eval. For instance:
  ```bash
  > dtsr --eval '"world" extends string ? "yes" : "no"'
  "yes"
  ```

2. **Use with a custom tsconfig**  
  If you have a custom tsconfig file, you can specify it with --project:
  ```bash
  > dtsr --project tsconfig.prod.json ./MyTypes.d.ts
  ```

3. **Make files directly executable**  
    Add the shebang line `#!/usr/bin/env dtsr` to the top of your file, and make them executable with `chmod +x ./main`. Now you can run them directly from the command line:

    ```ts
    #!/usr/bin/env dtsr
    // file: ./main
    export type Main = "Hello World!"
    ```
    Now you can run `./main` directly from the terminal.

    > [!NOTE]
    For the shebang to work, you need to have `dtsr` installed globally or in your PATH.


### Common Gotchas

- **No `Main` type found**: If you don't provide `--eval` and `dtsr` can't find `Main` in the file, you'll get an error. Either rename your main entry type to `Main` or use `--eval`.

- **Invalid arguments**: All `[args...]` passed after the source file are interpreted as strings. Make sure your `Main` type is expecting that structure (`string[]`).


---

For more examples, head over to the [Community Examples](#community-examples) section to see how you can leverage type-level programming to solve interesting problems.

## Community Examples

### FizzBuzz.d.ts

```bash
> dtsr ./FizzBuzz.d.ts 15
["1", "2", "Fizz", "4", "Buzz", "Fizz", "7", "8", "Fizz", "Buzz", "11", "Fizz", "13", "14", "FizzBuzz"]
```

```ts
type Main<Argv extends string[]> = Take<ParseInt<Argv[0]>, FizzBuzzIterator[1]>

type FizzBuzzIterator<
  S extends Record<any, any> = { 3: []; 5: []; i: [] },
  R extends string = `${S[3]['length'] extends 3 ? 'Fizz': ''}${S[5]['length'] extends 5 ? 'Buzz' : ''}`,
> = [
  R extends '' ? `${S['i']['length']}` : R,
  FizzBuzzIterator<{
    3: S[3]['length'] extends 3 ? [1] : [...S[3], 1]
    5: S[5]['length'] extends 5 ? [1] : [...S[5], 1]
    i: [...S['i'], 1]
  }>,
]

type Take<N extends number, Cons extends [any, any], Acc extends any[] = []> = Acc['length'] extends N ? Acc : Take<N, Cons[1], [...Acc, Cons[0]]>
type ParseInt<S extends string> = S extends `${infer N extends number}` ? N : never
```

### Fibonacci.d.ts

```bash
> dtsr ./Fibonacci.d.ts 10
55
```

```ts
type Main<Argv extends string[]> = Fib<ParseInt<Argv[0]>>

type Fib<X extends number>
  = X extends 0 ? 0
  : X extends 1 ? 1
  : Add<Fib<Sub<X, 1>>, Fib<Sub<X, 2>>>

type ParseInt<S extends string> = S extends `${infer N extends number}` ? N : never
type Repeat<N extends number, Acc extends true[] = []> = Acc['length'] extends N ? Acc : Repeat<N, [...Acc, true]>
type Tail<T extends any[]> = T extends [any, ...infer U] ? U : never
type Add<A extends number, B extends number> = [...Repeat<A>, ...Repeat<B>]['length']
type Dec<A extends number> = Tail<Repeat<A>>['length']
type Sub<A extends number, B extends number> = B extends 0 ? A : Sub<Dec<A>, Dec<B>>
```

### ParseQueryString.d.ts

```bash
> dtsr ./ParseQueryString.d.ts 'xs=1&xs=2&y=3&flag'
{ xs: ["1", "2"]; flag: [""]; y: ["3"]; }
```

```ts
type Main<Argv extends string[]> = Parse<Argv[0]>

type Parse<Q extends string>
  = Q extends '' ? {}
  : Q extends `${infer Head}&${infer Tail}` ?
    ([Parse<Head>, Parse<Tail>] extends [infer A, infer B] ?
      { [K in keyof A | keyof B]: [...(K extends keyof A ? Extract<A[K], any[]> : []), ...(K extends keyof B ? Extract<B[K], any[]> : []) ] } : never)
  : Q extends `${infer K}=${infer V}` ? { [P in K]: [V] }
  : { [P in Q]: [''] }
```


## Is this project for real?

No <sub><sub><sub>(But it does work as described)</sub></sub></sub>
