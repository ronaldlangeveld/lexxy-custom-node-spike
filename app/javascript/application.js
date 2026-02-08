// Configure your import map in config/importmap.rb. Read more: https://github.com/rails/importmap-rails
import "@hotwired/turbo-rails"
import "controllers"

import * as Lexxy from "lexxy"
import "@rails/actiontext"

import { ButtonNode } from "lexxy/nodes/button_node"

const COMMAND_PRIORITY_NORMAL = 2

class ButtonExtension extends Lexxy.Extension {
  get enabled() {
    return this.editorElement.supportsRichText
  }

  get lexicalExtension() {
    const editorEl = this.editorElement
    return {
      name: "lexxy/button",
      config: this.#config,
      nodes: [ButtonNode],
      register(editor, config) {
        editor.registerCommand(
          "insertButtonBlock",
          () => {
            const buttonNode = new ButtonNode({ buttonText: "Click me", buttonLink: "#" })
            editorEl.contents.insertAtCursorEnsuringLineBelow(buttonNode)
            return true
          },
          COMMAND_PRIORITY_NORMAL
        )
      }
    }
  }

  initializeToolbar(toolbar) {
    if (toolbar.querySelector("button[name=insert-button]")) return

    const button = document.createElement("button")
    button.type = "button"
    button.name = "insert-button"
    button.className = "lexxy-editor__toolbar-button"
    button.setAttribute("aria-label", "Insert Button")
    button.setAttribute("aria-pressed", "false")
    button.textContent = "Button"
    button.setAttribute("data-command", "insertButtonBlock")

    const undoBtn = toolbar.querySelector("button[name=undo]")
    if (undoBtn) {
      undoBtn.insertAdjacentElement("beforebegin", button)
    } else {
      toolbar.appendChild(button)
    }
  }

  get #config() {
    return this.editorConfig.get("button")
  }
}

Lexxy.configure({
  global: {
    extensions: [ButtonExtension]
  }
})

// Shim: Extensions#initializeToolbars() is defined but never called in lexxy 0.7.4.beta.
// This can be removed once the bug is fixed in a future release.
document.addEventListener("lexxy:initialize", (event) => {
  event.target.extensions.initializeToolbars()
})
