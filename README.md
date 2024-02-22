# zkb

# A Small script to create notes with appropriate metadata based on source file and koreader `.sdr` file

## Dependencies

- exiftool
   - arch: `pacman -S perl-image-exiftool`
- lua

## Basic use

`zkb meta <sourcefile>`

Dumps metadata. Log option give insight to tune the algorithm used for HTML files.

`zkb create <sourcefile>`

Create note file (`.md`) with source metadata in preamble. `--dir` option specifies a directory (defaults to `inbox`). Directory is relative to `ZK_NOTEBOOK_DIR` env variable (or current dir if not set). If an appropriate `.sdr` file exists, will extract highlighting data into note's body.

`zkb type <type> <filename>`

Utility to add a type field to existing note.
