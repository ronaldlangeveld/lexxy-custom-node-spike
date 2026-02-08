module Renderer
  class ButtonBlock
    extend ActiveModel::Naming

    class << self
      def from_node(node)
        return unless node["content-type"] == "application/button"

        content = node["content"]
        return if content.blank?

        attributes = parse_content(content)
        return unless attributes

        new(attributes)
      end

      private
        def parse_content(content)
          parsed = JSON.parse(content)
          return unless parsed.is_a?(Hash)

          {
            button_text: parsed["buttonText"].to_s.presence || "Click me",
            button_link: parsed["buttonLink"].to_s.presence || "#"
          }
        rescue JSON::ParserError
          nil
        end
    end

    attr_reader :button_text, :button_link

    def initialize(attributes = {})
      @button_text = attributes[:button_text] || "Click me"
      @button_link = attributes[:button_link] || "#"
    end

    def to_partial_path
      "action_text/attachables/renderer/button_block"
    end

    def attachable_plain_text_representation(*)
      "[Button: #{button_text}](#{button_link})"
    end
  end
end
