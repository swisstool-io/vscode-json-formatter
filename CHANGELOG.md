# Changelog

All notable changes to this project will be documented in this file.  
This project follows [Semantic Versioning](https://semver.org/).

---

## [1.0.0] - 2025-11-08
- Initial release
- Added commands:
  - `jsonFormatter.beautify`
  - `jsonFormatter.minify`
  - `jsonFormatter.sort`
  - `jsonFormatter.beautifySort`
- JSONC support (strips `//` and `/* */` comments; handles trailing commas)
- Selection-only formatting support
- Configuration options:
  - `jsonFormatter.sort.recursive`
  - `jsonFormatter.sort.caseInsensitive`
  - `jsonFormatter.showSuccessToast`
- CI workflow (Ubuntu, macOS, Windows) with compile + test steps
- Added README and basic documentation
