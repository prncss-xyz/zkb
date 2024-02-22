# zkb

# A Small script to create notes with appropriate metadata based on source file

## Dependencies

- exiftool
   - arch: `pacman -S perl-image-exiftool`

## Basic use

`zkb meta <sourcefile>`

Dumps metadata. Log option give insight to tune the algorithm used for HTML files.

`zkb create <sourcefile>`

Create an empty note file (`.md`) with source metadata in preamble. `--dir` option specifies a directory (defaults to `inbox`). Directory is relative to `ZK_NOTEBOOK_DIR` env variable (or current dir if not set).

`zkb type <type> <filename>`

Utility to add a type field to existing note.
