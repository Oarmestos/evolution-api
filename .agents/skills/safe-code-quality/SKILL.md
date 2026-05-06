---
name: safe-code-quality
description: Ensures code changes follow strict quality standards, avoiding unused variables, broken imports, and redundant design elements in Evolution API.
---

# Safe Code Quality Skill

When working on any code modification in this repository, follow these mandatory steps to ensure stability and cleanliness.

## When to use this skill

- Use this whenever you are modifying `.ts`, `.tsx`, or `.js` files.
- Use this before committing any change to ensure the build remains green and the code is clean.

## Mandatory Checklist

1. **Unused Code Detection**:
   - Before finishing a task, scan the file for variables or imports that were added but are no longer used after refactoring.
   - Remove any `unused` warnings immediately.

2. **Import Verification**:
   - Verify that all components or icons imported from external libraries (like `lucide-react`) actually exist in the installed version.
   - Check other files in the project for reference names.

3. **Design Fidelity**:
   - Do NOT add hardcoded decorative elements (e.g., placeholder text, fake counters, static badges) unless they are explicitly required or configurable via the Appearance settings.
   - Every UI element must be dynamic or justified by the user's configuration.

4. **PowerShell Compatibility**:
   - Always run Git commands sequentially. Never use `&&` in the terminal as it will fail on Windows/PowerShell environments.

5. **Final Clean-up**:
   - Perform a final pass on the modified file to ensure no "temporary" logic or debugging code was left behind.
   - Ensure `cn` utility or CSS classes are correctly applied and not duplicated.

## How to use it

1. Review the requested change.
2. Apply the change following the architectural patterns of Evolution API.
3. Run a mental or automated "lint check".
4. Remove any unused code identified during the process.
5. Deliver the clean code.
