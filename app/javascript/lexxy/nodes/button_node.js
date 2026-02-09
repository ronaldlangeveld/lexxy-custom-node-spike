import { CustomActionTextAttachmentNode } from "lexxy"

export class ButtonNode extends CustomActionTextAttachmentNode {
  static getType() {
    return "button"
  }

  static clone(node) {
    return new ButtonNode({ buttonText: node.buttonText, buttonLink: node.buttonLink }, node.__key)
  }

  static importJSON(serializedNode) {
    return new ButtonNode({
      buttonText: serializedNode.buttonText,
      buttonLink: serializedNode.buttonLink
    })
  }

  static importDOM() {
    return {
      "action-text-attachment": (element) => {
        if (element.getAttribute("content-type") !== "application/button") {
          return null
        }

        return {
          conversion: (attachment) => {
            let buttonText = "Click me"
            let buttonLink = "#"

            const contentAttr = attachment.getAttribute("content")
            if (contentAttr) {
              try {
                const parsed = JSON.parse(contentAttr)

                if (typeof parsed === "object" && parsed !== null) {
                  buttonText = parsed.buttonText || buttonText
                  buttonLink = parsed.buttonLink || buttonLink
                } else if (typeof parsed === "string") {
                  const doc = new DOMParser().parseFromString(parsed, "text/html")
                  const link = doc.querySelector("a.lexxy-button")
                  if (link) {
                    buttonText = link.textContent || buttonText
                    buttonLink = link.getAttribute("href") || buttonLink
                  }
                }
              } catch {
                // Malformed content, use defaults
              }
            }

            return {
              node: new ButtonNode({ buttonText, buttonLink })
            }
          },
          priority: 3
        }
      }
    }
  }

  constructor({ buttonText = "Click me", buttonLink = "#" } = {}, key) {
    super({ contentType: "application/button" }, key)
    this.buttonText = buttonText
    this.buttonLink = buttonLink
  }

  createDOM(config, editor) {
    const template = document.getElementById("button-node-template")
    const wrapper = template.content.cloneNode(true).firstElementChild

    const link = wrapper.querySelector("[data-button-node-target='link']")
    const textInput = wrapper.querySelector("[data-button-node-target='textInput']")
    const linkInput = wrapper.querySelector("[data-button-node-target='linkInput']")

    // Set initial values
    link.href = this.buttonLink
    link.textContent = this.buttonText || "Add button text"
    textInput.value = this.buttonText
    linkInput.value = this.buttonLink === "#" ? "" : this.buttonLink

    // Prevent navigation on click
    link.addEventListener("click", (e) => e.preventDefault())

    // Stop keyboard events from bubbling to Lexical — without this,
    // Backspace on an empty input deletes the entire node, Enter
    // creates a new paragraph, etc.
    const stopPropagation = (e) => e.stopPropagation()
    textInput.addEventListener("keydown", stopPropagation)
    linkInput.addEventListener("keydown", stopPropagation)

    // Sync text input to node and preview
    textInput.addEventListener("input", (e) => {
      editor.update(() => {
        this.getWritable().buttonText = e.target.value
      })
      link.textContent = e.target.value || "Add button text"
    })

    // Sync link input to node and preview
    linkInput.addEventListener("input", (e) => {
      editor.update(() => {
        this.getWritable().buttonLink = e.target.value || "#"
      })
      link.href = e.target.value || "#"
    })

    return wrapper
  }

  updateDOM() {
    return false
  }

  isInline() {
    return false
  }

  getTextContent() {
    return this.buttonText
  }

  exportDOM() {
    const attachment = document.createElement("action-text-attachment")
    attachment.setAttribute("content-type", "application/button")
    attachment.setAttribute("content", JSON.stringify({
      buttonText: this.buttonText,
      buttonLink: this.buttonLink
    }))
    return { element: attachment }
  }

  exportJSON() {
    return {
      type: "button",
      version: 1,
      buttonText: this.buttonText,
      buttonLink: this.buttonLink
    }
  }

  decorate() {
    return null
  }
}
