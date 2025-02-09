# dtsr

```bash
dtsr ./Test.d.ts a b c
dtsr -e 'Main<["a", "b", "c"]>' ./Test.d.ts:Main
```

Making executables

```
#!/usr/bin/env dtsr
export type Main<Argv extends string[]> = `Hello ${Argv[0]}!`
```
