# dtsx

```bash
dtsx ./Test.d.ts a b c
dtsx -e 'Main<["a", "b", "c"]>' ./Test.d.ts:Main
```

Making executables

```
#!/usr/bin/env dtsx
export type Main<Argv extends string[]> = `Hello ${Argv[0]}!`
```
