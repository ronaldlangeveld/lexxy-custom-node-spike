# Lexxy Custom Node Spike

A sample Rails 8.1 app demonstrating how to add a custom block (node) to the [Lexxy](https://github.com/basecamp/lexxy) rich text editor. Uses a **Button block** as the example — a styled CTA button with editable text and URL.

## Setup

```bash
bundle install
bin/rails db:setup
bin/dev
```

Visit `http://localhost:3000/posts/new` to see the editor with the custom Button toolbar button.

## How the Custom Block Works

A custom Lexxy block spans across JavaScript, Ruby, ERB, and CSS. Here's every file involved and what it does.

### 1. Lexical Node — `app/javascript/lexxy/nodes/button_node.js`

The data model for the block. Extends `CustomActionTextAttachmentNode` from Lexxy.

- `getType()` — returns `"button"`, the unique node type identifier
- `createDOM()` — clones an HTML `<template>` and wires up event listeners to sync the DOM with Lexical state
- `exportDOM()` — serializes to `<action-text-attachment content-type="application/button">` with a JSON `content` attribute
- `importDOM()` — deserializes back, handling both raw JSON (first save) and rendered HTML (round-trip after server processing)
- `exportJSON()` / `importJSON()` — Lexical's internal serialization

### 2. Lexxy Extension — defined in `app/javascript/application.js`

Registers the node with the editor and adds a toolbar button.

- `lexicalExtension` — returns a Lexical extension that registers the `ButtonNode` and an `insertButtonBlock` command
- `initializeToolbar()` — adds a "Button" toolbar button with `data-command="insertButtonBlock"`

**Note:** In Lexxy `0.7.4.beta`, `Extensions#initializeToolbars()` is defined but never called. A shim at the bottom of `application.js` listens for `lexxy:initialize` and calls it manually. This can be removed once the bug is fixed upstream.

### 3. Importmap Pin — `config/importmap.rb`

```ruby
pin_all_from "app/javascript/lexxy", under: "lexxy"
```

Auto-pins all files under `app/javascript/lexxy/`, so `import { ButtonNode } from "lexxy/nodes/button_node"` just works.

### 4. Editor Template — `app/views/lexxy/_button_node.html.erb`

An HTML `<template>` that `createDOM()` clones. Uses `data-button-node-target` attributes for the node to find elements. Rendered in the form partial alongside the editor:

```erb
<%= form.rich_text_area :content %>
<%= render "lexxy/button_node" %>
```

### 5. Server-Side Model — `app/models/renderer/button_block.rb`

Parses the `<action-text-attachment>` JSON content into a Ruby object with `button_text` and `button_link` attributes. Returns `nil` for wrong content-types or malformed data so other resolvers can handle those attachments.

### 6. Action Text Initializer — `config/initializers/blocks/action_text_button_attachable.rb`

Prepends a resolver onto `ActionText::Attachable` so that `<action-text-attachment content-type="application/button">` elements resolve to `Renderer::ButtonBlock` instead of the default handler.

### 7. Read-Only Partial — `app/views/action_text/attachables/renderer/_button_block.html.erb`

Renders the button as a clickable `<a>` tag when displaying saved content (outside the editor). Rails calls this automatically via `to_partial_path`.

### 8. CSS — `app/assets/stylesheets/application.css`

- `.lexxy-button-node` — editor block layout (preview + edit panel side by side)
- `.lexxy-button` — shared button styles (pink, rounded, white text)
- `.lexxy-button-rendered` — read-only output styles (centered, with hover state)

## File Overview

```
app/
  javascript/
    application.js                          # Extension class + Lexxy.configure
    lexxy/nodes/button_node.js              # Lexical node
  models/
    renderer/button_block.rb                # Server-side model
  views/
    lexxy/_button_node.html.erb             # Editor <template>
    posts/_form.html.erb                    # Form with editor + template render
    action_text/attachables/renderer/
      _button_block.html.erb                # Read-only partial
  assets/stylesheets/
    application.css                         # Editor + read-only styles
config/
  importmap.rb                              # Pin for lexxy/ JS modules
  initializers/blocks/
    action_text_button_attachable.rb        # Action Text resolver
```

## Adding Your Own Block

To add a new block type (e.g. `accordion`), follow the same pattern:

1. Create `app/javascript/lexxy/nodes/accordion_node.js` extending `CustomActionTextAttachmentNode`
2. Add an `AccordionExtension` class in `application.js` (or a separate file) with `lexicalExtension` and `initializeToolbar`
3. Create `app/views/lexxy/_accordion_node.html.erb` with a `<template>` for the editor UI
4. Render it in your form: `<%= render "lexxy/accordion_node" %>`
5. Create `app/models/renderer/accordion_block.rb` to parse the attachment
6. Create `config/initializers/blocks/action_text_accordion_attachable.rb` to register the resolver
7. Create `app/views/action_text/attachables/renderer/_accordion_block.html.erb` for the read-only output
8. Add styles to `application.css`

Use `application/accordion` as the content-type string throughout.
