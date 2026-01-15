# Project overview

HTML Canvas game written in typescript. No frameworks or libraries, just pure typescript.

# Tech rules

- Don't try to install any libraries
- Never try to run/build the project - I'll do it myself.
- Prefer string union over enums, if you also need an array of values - base the string union on that array (const arr = ["a", "b"] as const; type MyUnion = typeof arr[number]) or something like that. The point is - make sure there is always only 1 source of truth
- Use ECS architecture
- Avoid `any` type and using `as` if not necessary
- When implementing new features make sure I can test them easily after running the project.
- When planning make sure every step can be tested on it's own. I want to make sure everything is working before moving on.
- Ask questions if something isn't clear.
- Avoid code duplication. When working on new features make sure similar code isn't created somewhere else. If so, refactor that so it's reusable
- Follow typescript, gamedev and ECS best practices
- When done implementing something edit plan.md and if you discover that something can be done better or should be done in differento order than in plan.md - suggest improvements.
- Avoid comments
- Avoid getters and setters if they are not doing anything special. Just use public field in that case.
- Avoid index files.
- Make sure coding style is consistent
